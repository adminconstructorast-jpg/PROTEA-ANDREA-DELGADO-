import Stripe from 'stripe';
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  REGION,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
} from '../config.js';
import { db, FieldValue } from '../lib/admin.js';
import { COLLECTIONS, type Payment } from '../shared.js';

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    // Se usa la versión de API por defecto del SDK instalado para evitar
    // desalineación de tipos entre versiones de `stripe`.
    stripe = new Stripe(STRIPE_SECRET_KEY.value());
  }
  return stripe;
}

/**
 * Callable (staff): crea un Checkout Session de Stripe para cobrar un pago
 * (anticipo/mensualidad) de un evento y devuelve la URL de pago para el cliente.
 */
export const createPaymentCheckout = onCall(
  { region: REGION, secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    const role = (request.auth?.token as Record<string, unknown> | undefined)?.role;
    if (role !== 'planner' && role !== 'staff') {
      throw new HttpsError('permission-denied', 'Requiere rol planner o staff.');
    }

    const { eventId, paymentId, successUrl, cancelUrl } = request.data as {
      eventId: string;
      paymentId: string;
      successUrl: string;
      cancelUrl: string;
    };

    const paymentRef = db
      .collection(COLLECTIONS.EVENTS)
      .doc(eventId)
      .collection(COLLECTIONS.PAYMENTS)
      .doc(paymentId);
    const snap = await paymentRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Pago no encontrado.');
    }
    const payment = snap.data() as Payment;

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: payment.amount.currency.toLowerCase(),
            product_data: { name: `${payment.concept} — PROTEA` },
            unit_amount: payment.amount.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { eventId, paymentId },
    });

    await paymentRef.set(
      {
        status: 'processing',
        method: 'stripe_checkout',
        gatewayRef: session.id,
        checkoutUrl: session.url,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { url: session.url, sessionId: session.id };
  },
);

/**
 * Webhook de Stripe: marca los pagos como pagados al confirmarse el checkout.
 * Requiere el cuerpo crudo para validar la firma.
 */
export const stripeWebhook = onRequest(
  { region: REGION, secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const signature = req.get('stripe-signature');
    if (!signature || !req.rawBody) {
      res.status(400).send('Missing signature');
      return;
    }

    let evt: Stripe.Event;
    try {
      evt = getStripe().webhooks.constructEvent(
        req.rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET.value(),
      );
    } catch (err) {
      logger.warn('Firma de Stripe inválida', err);
      res.status(400).send('Invalid signature');
      return;
    }

    if (evt.type === 'checkout.session.completed') {
      const session = evt.data.object as Stripe.Checkout.Session;
      const { eventId, paymentId } = session.metadata ?? {};
      if (eventId && paymentId) {
        try {
          await db
            .collection(COLLECTIONS.EVENTS)
            .doc(eventId)
            .collection(COLLECTIONS.PAYMENTS)
            .doc(paymentId)
            .set(
              {
                status: 'paid',
                paidAt: FieldValue.serverTimestamp(),
                gatewayRef: session.payment_intent
                  ? String(session.payment_intent)
                  : session.id,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          logger.info(`Pago ${paymentId} del evento ${eventId} marcado como pagado`);
        } catch (err) {
          logger.error('No se pudo actualizar el pago tras checkout', err);
        }
      }
    }

    res.status(200).send('ok');
  },
);
