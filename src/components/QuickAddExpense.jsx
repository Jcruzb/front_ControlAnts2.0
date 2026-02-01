/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from "react";

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
    const isoToday = new Date().toISOString().slice(0, 10);
    return todayEnabled ? isoToday : minDate;
  });
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;

    let resolvedDate = null;

    if (dateOption === "today") {
      if (!todayEnabled) return;
      resolvedDate = today.toISOString().slice(0, 10);
    } else if (dateOption === "yesterday") {
      if (!yesterdayEnabled) return;
      resolvedDate = yesterday.toISOString().slice(0, 10);
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center">
      {/* Sheet / Modal */}
      <div className="w-full rounded-t-2xl bg-white p-4 sm:max-w-md sm:rounded-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Añadir gasto</p>
            <h2 className="text-lg font-semibold">
              {context?.categoryIcon} {context?.name}
              {context?.type === "recurring" && (
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs">
                  Fijo
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            placeholder="0,00 €"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Date selector */}
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
                className={`flex-1 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                  dateOption === opt.key
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Month info (placeholder UX) */}
          <p className="mt-2 text-xs text-gray-500">
            Se registrará en: <strong>{pad2(budgetMonth)}/{budgetYear}</strong>
          </p>

          {dateOption === "custom" && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Fecha
              </label>
              <input
                type="date"
                value={customDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* CTA */}
        <button
        onClick={handleSubmit}
          disabled={!amount || Number(amount) <= 0}
          className="w-full rounded-xl bg-indigo-600 py-3 text-white disabled:opacity-40"
        >
          Guardar gasto
        </button>
      </div>
    </div>
  );
}