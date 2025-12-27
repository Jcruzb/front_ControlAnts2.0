/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from "react";

export default function QuickAddExpense({
  isOpen,
  onClose,
  context, // { name, type, categoryIcon }
}) {
  if (!isOpen) return null;

  const [amount, setAmount] = useState("");
  const [dateOption, setDateOption] = useState("today");
  const [note, setNote] = useState("");

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
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
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
            Se registrará en: <strong>Mes actual</strong>
          </p>
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
          disabled={!amount || Number(amount) <= 0}
          className="w-full rounded-xl bg-indigo-600 py-3 text-white disabled:opacity-40"
        >
          Guardar gasto
        </button>
      </div>
    </div>
  );
}