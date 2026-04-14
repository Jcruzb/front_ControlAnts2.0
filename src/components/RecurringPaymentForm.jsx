import { useState } from "react";
import AddCategoryModal from "./AddCategoryModal";

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
  onCategoryCreated,
}) {
  const isEdit = Boolean(initialData);

  const getInitialFormState = () => ({
    name: initialData?.name || "",
    amount: initialData?.amount || "",
    dueDay: initialData?.due_day || "",
    category: initialData?.category || "",
    startDate: initialData?.start_date || "",
    hasEndDate: Boolean(initialData?.end_date),
    endDate: initialData?.end_date || "",
  });

  const [name, setName] = useState(() => getInitialFormState().name);
  const [amount, setAmount] = useState(() => getInitialFormState().amount);
  const [dueDay, setDueDay] = useState(() => getInitialFormState().dueDay);
  const [category, setCategory] = useState(() => getInitialFormState().category);
  const [startDate, setStartDate] = useState(() => getInitialFormState().startDate);
  const [hasEndDate, setHasEndDate] = useState(() => getInitialFormState().hasEndDate);
  const [endDate, setEndDate] = useState(() => getInitialFormState().endDate);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full rounded-[32px] border border-white/10 bg-[#0d1117] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-[560px] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Gasto fijo</p>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {isEdit ? "Editar gasto fijo" : "Añadir gasto fijo"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Compromiso mensual que forma parte de tu presupuesto
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/[0.08]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Netflix, Préstamo coche, ChatGPT…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Importe mensual (€)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Día de cobro
              </label>
              <select
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
              >
                <option value="">Selecciona un día</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-200">
                  Categoría
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                >
                  + Nueva categoría
                </button>
              </div>
              <label className="sr-only">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
            />
          </div>

          <div className="space-y-3 rounded-[24px] border border-white/8 bg-black/20 p-4">
            <label className="flex items-center gap-3">
              <span className="relative flex h-5 w-5 items-center justify-center">
                <input
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="h-5 w-5 rounded-md border border-white/15 bg-white/[0.04] transition peer-checked:border-blue-400/50 peer-checked:bg-blue-500/20" />
                <span className="pointer-events-none absolute text-[11px] font-bold text-white opacity-0 transition peer-checked:opacity-100">
                  ✓
                </span>
              </span>
              <span>
                <span className="block text-sm font-medium text-slate-200">
                  Tiene fecha de fin
                </span>
                <span className="block text-xs text-slate-500">
                  Activa este campo si el compromiso termina en una fecha concreta.
                </span>
              </span>
            </label>

            {hasEndDate && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
                />
              </div>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-500 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              {isEdit ? "Guardar cambios" : "Crear gasto fijo"}
            </button>
          </div>
        </form>

        {isCategoryModalOpen && (
          <AddCategoryModal
            onClose={() => setIsCategoryModalOpen(false)}
            onCreated={(newCategory) => {
              if (typeof onCategoryCreated === "function") {
                onCategoryCreated(newCategory);
              }
              setCategory(String(newCategory.id));
              setIsCategoryModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
