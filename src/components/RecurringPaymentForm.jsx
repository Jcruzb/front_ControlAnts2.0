import { useEffect, useState } from "react";

/**
 * RecurringPaymentForm
 * --------------------
 * Formulario para CREAR / EDITAR un gasto fijo (RecurringPayment).
 * - NO registra pagos
 * - Define compromisos mensuales
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onSubmit: function(data)
 * - initialData: object | null  (para edición)
 * - categories: array [{ id, name, icon }]
 */
export default function RecurringPaymentForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  categories = [],
}) {
  const isEdit = Boolean(initialData);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");

  // Inicializa el formulario solo al abrir el modal (evita renders innecesarios)
  useEffect(() => {
    if (!isOpen || !initialData) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(initialData.name || "");
    setAmount(initialData.amount || "");
    setCategory(initialData.category || "");
    setStartDate(initialData.start_date || "");
    setEndDate(initialData.end_date || "");
    setHasEndDate(Boolean(initialData.end_date));
    setDueDay(initialData.due_day || "");
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      amount: Number(amount),
      due_day: Number(dueDay),
      category,
      start_date: startDate,
      end_date: hasEndDate ? endDate : null,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center">
      <div className="w-full rounded-t-2xl bg-white p-4 sm:max-w-md sm:rounded-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {isEdit ? "Editar gasto fijo" : "Añadir gasto fijo"}
            </h2>
            <p className="text-sm text-gray-500">
              Compromiso mensual que forma parte de tu presupuesto
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Netflix, Préstamo coche, ChatGPT…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Importe */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Importe mensual (€)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Día de cobro */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Día de cobro
            </label>
            <select
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              required
              className="w-full rounded-lg border px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecciona un día</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-lg border px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha inicio */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Fecha fin */}
          <div className="space-y-2">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => setHasEndDate(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Tiene fecha de fin
              </span>
            </label>

            {hasEndDate && (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* CTA */}
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 text-white font-medium"
          >
            {isEdit ? "Guardar cambios" : "Crear gasto fijo"}
          </button>
        </form>
      </div>
    </div>
  );
}