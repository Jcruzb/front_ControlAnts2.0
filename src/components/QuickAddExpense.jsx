/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from "react";
import { getRelativeLocalDate, getTodayLocalDate } from "../utils/date";

export default function QuickAddExpense({
  isOpen,
  onClose,
  context,
  onSubmit,
  budgetYear,
  budgetMonth,
}) {
  if (!isOpen) return null;

  const pad2 = (n) => String(n).padStart(2, "0");

  // budgetMonth is 1-12
  const daysInBudgetMonth = new Date(budgetYear, budgetMonth, 0).getDate();
  const minDate = `${budgetYear}-${pad2(budgetMonth)}-01`;
  const maxDate = `${budgetYear}-${pad2(budgetMonth)}-${pad2(daysInBudgetMonth)}`;

  const isInBudgetMonth = (d) =>
    d.getFullYear() === Number(budgetYear) && d.getMonth() + 1 === Number(budgetMonth);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const todayEnabled = isInBudgetMonth(today);
  const yesterdayEnabled = isInBudgetMonth(yesterday);

  const [amount, setAmount] = useState("");
  const [dateOption, setDateOption] = useState("today");
  const [customDate, setCustomDate] = useState(() => {
    const isoToday = getTodayLocalDate();
    return todayEnabled ? isoToday : minDate;
  });
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;

    let resolvedDate = null;

    if (dateOption === "today") {
      if (!todayEnabled) return;
      resolvedDate = getTodayLocalDate();
    } else if (dateOption === "yesterday") {
      if (!yesterdayEnabled) return;
      resolvedDate = getRelativeLocalDate(-1);
    } else {
      // custom
      if (!customDate) return;
      if (customDate < minDate || customDate > maxDate) return;
      resolvedDate = customDate;
    }

    await onSubmit({
      amount: Number(amount),
      date: resolvedDate,
      note,
      categoryId: context?.categoryId,
      plannedExpenseId: context?.plannedExpenseId ?? null,
      recurringPaymentId: context?.recurringPaymentId ?? null,
    });

    // reset UX
    setAmount("");
    setNote("");
    setDateOption("today");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full rounded-[32px] border border-white/10 bg-[#0d1117] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Añadir gasto</p>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {context?.categoryIcon} {context?.name}
              {context?.type === "recurring" && (
                <span className="ml-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-300">
                  Fijo
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300 transition hover:bg-white/[0.08]"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            placeholder="0,00 €"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-2xl font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
          />
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            {[
              { key: "today", label: "Hoy" },
              { key: "yesterday", label: "Ayer" },
              { key: "custom", label: "Otra fecha" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDateOption(opt.key)}
                disabled={
                  (opt.key === "today" && !todayEnabled) ||
                  (opt.key === "yesterday" && !yesterdayEnabled)
                }
                className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  dateOption === opt.key
                    ? "border-blue-400/30 bg-blue-500/12 text-blue-100"
                    : "border-white/10 bg-white/[0.03] text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Se registrará en: <strong className="text-slate-300">{pad2(budgetMonth)}/{budgetYear}</strong>
          </p>

          {dateOption === "custom" && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Fecha
              </label>
              <input
                type="date"
                value={customDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400/50"
              />
            </div>
          )}
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!amount || Number(amount) <= 0}
          className="w-full rounded-2xl bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:opacity-40"
        >
          Guardar gasto
        </button>
      </div>
    </div>
  );
}
