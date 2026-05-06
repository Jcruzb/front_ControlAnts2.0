import { useState } from "react";
import { getTodayLocalDate } from "../utils/date";
import PayerSelect from "./PayerSelect";
import { parseAmount } from "../utils/amounts";

function buildInitialForm(expense) {
  return {
    amount:
      expense?.amount !== null && expense?.amount !== undefined
        ? String(expense.amount)
        : "",
    description: expense?.description || "",
    category:
      expense?.category !== null && expense?.category !== undefined
        ? String(expense.category)
        : "",
    date: expense?.date || getTodayLocalDate(),
    payer:
      expense?.payer !== null && expense?.payer !== undefined
        ? String(expense.payer)
        : "",
  };
}

export default function ExpenseFormModal({
  isOpen,
  expense = null,
  categories = [],
  payers = [],
  payersError = null,
  loading = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => buildInitialForm(expense));
  const [amountError, setAmountError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = parseAmount(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError("Introduce un importe válido mayor que 0");
      return;
    }

    setAmountError(null);
    const payload = {
      amount: amount.toFixed(2),
      description: form.description,
      category: form.category,
      date: form.date,
    };

    if (form.payer) {
      payload.payer = Number(form.payer);
    }

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full rounded-[32px] border border-white/10 bg-[#0d1117] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-xl sm:rounded-[28px] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Gasto</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Editar gasto
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm text-slate-400">Importe</span>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => {
                  setAmountError(null);
                  handleChange("amount")(event);
                }}
                className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-2xl font-semibold text-white outline-none transition focus:border-blue-400/50"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">
                €
              </span>
            </div>
            {amountError ? (
              <p className="text-sm text-red-200">{amountError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <span className="text-sm text-slate-400">Descripción</span>
            <input
              type="text"
              value={form.description}
              onChange={handleChange("description")}
              placeholder="¿En qué fue el gasto?"
              className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm text-slate-400">Categoría</span>
            <select
              value={form.category}
              onChange={handleChange("category")}
              className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-blue-400/50"
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon ? `${category.icon} ` : ""}{category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-slate-400">Fecha</span>
            <input
              type="date"
              value={form.date}
              onChange={handleChange("date")}
              className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-blue-400/50"
              required
            />
          </div>

          <div>
            <PayerSelect
              value={form.payer}
              onChange={(value) =>
                setForm((current) => ({ ...current, payer: value }))
              }
              payers={payers}
              disabled={loading}
            />
            {payersError ? (
              <p className="mt-2 text-xs text-amber-200">
                {payersError}. Puedes guardar sin seleccionar pagador.
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-[24px] bg-blue-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-base font-medium text-slate-200 transition hover:bg-white/[0.08]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
