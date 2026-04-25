import { useMemo, useState } from "react";
import { getTodayLocalDate } from "../utils/date";

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getDefaultDate(year, month) {
  const now = new Date();
  if (year === now.getFullYear() && month === now.getMonth() + 1) {
    return getTodayLocalDate();
  }

  const lastDay = getLastDayOfMonth(year, month);
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export default function AdjustIncomePlanModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  budgetYear,
  budgetMonth,
  loading = false,
  error = null,
}) {
  const minDate = useMemo(
    () => `${budgetYear}-${String(budgetMonth).padStart(2, "0")}-01`,
    [budgetMonth, budgetYear]
  );

  const maxDate = useMemo(() => {
    const lastDay = getLastDayOfMonth(budgetYear, budgetMonth);
    return `${budgetYear}-${String(budgetMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }, [budgetMonth, budgetYear]);

  const resolvedIncome = item?.resolved_income || null;
  const plannedAmount = item?.planned_amount ?? "";

  const [form, setForm] = useState(() => ({
    amount: resolvedIncome?.amount ?? plannedAmount ?? "",
    date: resolvedIncome?.date ?? getDefaultDate(budgetYear, budgetMonth),
    description: resolvedIncome?.description ?? item?.description ?? "",
  }));

  if (!isOpen || !item) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      amount: Number(form.amount),
      date: form.date,
      description: form.description || "",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full rounded-[32px] border border-white/10 bg-[#0d1117] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-md">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Ajustar salario</p>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              {item.name || "Ingreso planificado"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/[0.08]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Importe real
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">
              Fecha
            </label>
            <input
              type="date"
              value={form.date}
              min={minDate}
              max={maxDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">
              Descripción
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Ej: Ajuste por bonus, variable, atraso..."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-emerald-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar ajuste"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
