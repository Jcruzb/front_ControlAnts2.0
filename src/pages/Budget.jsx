/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import BudgetItem from "../components/BudgetItem";
import api from "../services/api"; // axios centralizado

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function Budget() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchBudget() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/budget/", {
        params: { year, month },
      });
      setData(res);
    } catch (err) {
        console.error(err);
      setError("No se pudo cargar el presupuesto");
    } finally {
      setLoading(false);
    }
  }
  async function handleQuickAddSubmit({
    amount,
    date_option,
    custom_date,
    note,
    categoryId,
    plannedExpenseId,
    recurringPaymentId,
  }) {
    // Date rules:
    // - If user picked a custom date, use it as-is.
    // - Otherwise, record the expense within the currently selected budget month/year.
    //   We keep the day-of-month from today (or today-1 for "Ayer") and clamp to the month length.
    const pad2 = (n) => String(n).padStart(2, "0");

    const today = new Date();
    let baseDay = today.getDate();

    // If user selects "Ayer", subtract 1 day from the base day (within the selected month context)
    if (date_option === "yesterday") {
      baseDay = baseDay - 1;
    }

    const daysInSelectedMonth = new Date(year, month, 0).getDate(); // month is 1-12 here
    const safeDay = Math.min(Math.max(baseDay, 1), daysInSelectedMonth);

    const computedDate = `${year}-${pad2(month)}-${pad2(safeDay)}`;

    const payload = {
      amount,
      date: date_option === "custom" && custom_date ? custom_date : computedDate,
      description: note || "",
      category: categoryId,
      planned_expense: plannedExpenseId,
      recurring_payment: recurringPaymentId,
    };

    console.log("[QuickAdd] Enviando gasto:", payload);

    await api.post("/expenses/", payload);

    await fetchBudget();
  }

  useEffect(() => {
    fetchBudget();
  }, [year, month]);

  const monthLabel = useMemo(
    () => `${MONTH_NAMES[month - 1]} ${year}`,
    [month, year]
  );

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Cargando presupuesto…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-600">{error || "Error inesperado"}</p>
      </div>
    );
  }

  const {
    status,
    remaining_amount,
    total_planned,
    total_spent,
    planned = [],
    recurring = [],
    unplanned_total,
  } = data;

  const statusText =
    status === "over"
      ? "Te has pasado este mes"
      : status === "warning"
      ? "Ojo, estás cerca del límite"
      : "Vas bien este mes";

  const statusColor =
    status === "over"
      ? "text-red-700"
      : status === "warning"
      ? "text-amber-700"
      : "text-emerald-700";

  return (
    <div className="space-y-6 p-4">
      {/* Selector de mes / año */}
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {monthLabel}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setYear(now.getFullYear());
              setMonth(now.getMonth() + 1);
            }}
            className="rounded-lg border bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 md:text-sm"
          >
            Hoy
          </button>

          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = now.getFullYear() - 2 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </section>

      {/* Totales */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-gray-500">Gastado</p>
          <p className="text-lg font-semibold">{total_spent} €</p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-gray-500">Disponible</p>
          <p className={`text-lg font-semibold ${statusColor}`}>
            {remaining_amount} €
          </p>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-gray-500">Planificado</p>
          <p className="text-lg font-semibold">{total_planned} €</p>
        </div>
      </section>
      <section>
        <p className={`text-sm font-medium ${statusColor}`}>
          {statusText}
        </p>
      </section>

      {/* Planned expenses */}
      {planned.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Gastos planificados
          </h2>
          <div className="space-y-3">
            {planned.map((item) => (
              <BudgetItem
                key={`planned-${item.id}`}
                type="planned"
                item={item}
                icon="🛒"
                onQuickAddSubmit={handleQuickAddSubmit}
                monthLabel={monthLabel}
              />
            )
            )}
          </div>
        </section>
      )}

      {/* Recurring expenses */}
      {recurring.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Gastos fijos
          </h2>
          <div className="space-y-3">
            {recurring.map((item) => (
              <BudgetItem
                key={`recurring-${item.id}`}
                type="recurring"
                item={item}
                icon="🔁"
                onQuickAddSubmit={handleQuickAddSubmit}
                monthLabel={monthLabel}
              />
            ))}
          </div>
        </section>
      )}

      {/* Unplanned summary */}
      {unplanned_total > 0 && (
        <section className="rounded-xl border bg-gray-50 p-3">
          <p className="text-sm text-gray-700">
            Gastos no planificados este mes:{" "}
            <strong>{unplanned_total} €</strong>
          </p>
        </section>
      )}
    </div>
  );
}