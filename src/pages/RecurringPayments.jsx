import { useEffect, useState } from "react";
import recurringPaymentsService from "../services/recurringPaymentsService";
import RecurringPaymentItem from "../components/RecurringPaymentItem";
import RecurringPaymentForm from "../components/RecurringPaymentForm";
import api from "../services/api";

/**
 * RecurringPayments
 * -----------------
 * Vista principal de Gastos fijos.
 * - Lista gastos fijos
 * - Permite crear / editar / desactivar
 * - NO registra pagos
 */
export default function RecurringPayments() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Mapa rápido de categorías por id
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recurring, cats] = await Promise.all([
        recurringPaymentsService.getAll(),
        api.get("/categories/"),
      ]);
      setItems(recurring);
      setCategories(cats);
    } catch (error) {
      console.error("Error cargando gastos fijos", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingItem) {
        await recurringPaymentsService.update(editingItem.id, data);
      } else {
        await recurringPaymentsService.create(data);
      }
      closeModal();
      loadData();
    } catch (error) {
      console.error("Error guardando gasto fijo", error);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("¿Desactivar este gasto fijo?")) return;

    try {
      await recurringPaymentsService.deactivate(id);
      loadData();
    } catch (error) {
      console.error("Error desactivando gasto fijo", error);
    }
  };

  const handleReactivate = async (id) => {
    try {
      await recurringPaymentsService.reactivate(id);
      loadData();
    } catch (error) {
      console.error("Error reactivando gasto fijo", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gastos fijos</h1>
          <p className="text-sm text-gray-500">
            Compromisos mensuales que forman parte de tu presupuesto
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white"
        >
          + Añadir
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-gray-500">Cargando gastos fijos…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-gray-500">
          <p className="mb-2">Aún no tienes gastos fijos</p>
          <button
            onClick={openCreateModal}
            className="text-indigo-600 hover:underline"
          >
            Añadir tu primer gasto fijo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <RecurringPaymentItem
              key={item.id}
              item={item}
              categoryMap={categoryMap}
              onEdit={openEditModal}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <RecurringPaymentForm
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={editingItem}
        categories={categories}
      />
    </div>
  );
}
