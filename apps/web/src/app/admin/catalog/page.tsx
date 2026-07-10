'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
}

export default function CatalogPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Campos del formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [unit, setUnit] = useState('evento');

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('name', 'asc'));
    return onSnapshot(q, (snap) => {
      setServices(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }) as Service)
      );
    });
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('');
    setUnit('evento');
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    setPrice(service.price);
    setUnit(service.unit);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '') return;

    const serviceData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      unit: unit.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingService) {
        // Modo Editar
        const serviceRef = doc(db, 'services', editingService.id);
        await updateDoc(serviceRef, serviceData);
      } else {
        // Modo Crear
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error al guardar el servicio:', err);
      alert('Error al guardar el servicio en Firestore.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('No se pudo eliminar el servicio.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Administración</p>
          <h1 className="mt-1 font-serif text-4xl">Catálogo de Servicios</h1>
        </div>
        <button
          onClick={openAddModal}
          className="btn bg-terracotta hover:bg-terracotta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Agregar Servicio
        </button>
      </div>

      {/* Tabla de Servicios */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-sand bg-white/60">
        <table className="w-full text-sm">
          <thead className="bg-sand/50 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-6 py-4">Servicio</th>
              <th className="px-6 py-4">Descripción</th>
              <th className="px-6 py-4">Precio Unitario</th>
              <th className="px-6 py-4">Unidad</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-sand/10 transition">
                <td className="px-6 py-4 font-semibold text-ink">{service.name}</td>
                <td className="px-6 py-4 text-ink/75 max-w-xs truncate" title={service.description}>
                  {service.description || 'Sin descripción'}
                </td>
                <td className="px-6 py-4 font-medium text-ink">
                  ${service.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-ink/60">
                  <span className="rounded-full bg-sand px-2 py-0.5 text-xs">
                    {service.unit}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => openEditModal(service)}
                    className="text-xs font-semibold text-gold hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-xs font-semibold text-clay hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-ink/40">
                  El catálogo de servicios está vacío. Comienza agregando uno nuevo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Modal Formulario (Overlay + Card) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl border border-sand">
            <h2 className="font-serif text-2xl mb-4">
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Coordinación de Bodas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-sand px-3 py-2 text-sm focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  placeholder="Describe detalladamente el alcance del servicio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-sand px-3 py-2 text-sm focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1">
                    Precio (MXN)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-sand px-3 py-2 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-sand px-3 py-2 text-sm bg-white focus:outline-none focus:border-terracotta"
                  >
                    <option value="evento">Por Evento</option>
                    <option value="hora">Por Hora</option>
                    <option value="persona">Por Persona</option>
                    <option value="m2">Por Metro Cuadrado</option>
                    <option value="fijo">Cargo Fijo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-sand">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm font-semibold text-ink/60 hover:underline px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-terracotta hover:bg-terracotta/90 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
