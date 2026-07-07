import { COLLECTIONS } from '../shared.js';
import { db, FieldValue } from './admin.js';

/**
 * Encola un correo escribiendo en la colección `mail`, procesada por la
 * extensión oficial "Trigger Email" (firestore-send-email).
 * Instalación: firebase ext:install firebase/firestore-send-email
 */
export async function queueMail(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  await db.collection(COLLECTIONS.MAIL).add({
    to: Array.isArray(params.to) ? params.to : [params.to],
    replyTo: params.replyTo,
    message: {
      subject: params.subject,
      html: params.html,
    },
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Layout HTML mínimo con la identidad de PROTEA. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#faf7f2;font-family:Georgia,'Times New Roman',serif;color:#2d2a26;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <p style="letter-spacing:0.3em;font-size:12px;text-transform:uppercase;color:#a58e6f;margin-bottom:24px;">PROTEA · Andrea Delgado</p>
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px;">${title}</h1>
      <div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>
      <hr style="border:none;border-top:1px solid #e5ddd0;margin:32px 0 16px;" />
      <p style="font-size:12px;color:#8c8577;">Wedding &amp; Event Planning · <a href="https://www.instagram.com/andreadelgadoplanner/" style="color:#a58e6f;">@andreadelgadoplanner</a></p>
    </div>
  </body>
</html>`;
}
