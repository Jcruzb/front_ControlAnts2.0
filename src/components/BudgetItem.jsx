import { useMemo, useState } from "react";
import QuickAddExpense from "./QuickAddExpense";

/**
 * BudgetItem
 * - Pure UI: receives computed fields from backend (no calculations beyond display helpers)
 * - Provides a fast “+” action to open QuickAddExpense with context prefilled
 *
 * Expected `item` shape (from /api/budget/):
 *  Planned:
 *    { id, category, planned_amount, spent_amount, remaining_amount, percentage_used, status }
 *  Recurring:
 *    { id, name, planned_amount, spent_amount, remaining_amount, percentage_used, status }
 *
 * Props:
 * - type: "planned" | "recurring"
 * - item: object (see above)
 * - icon: string (emoji) optional (e.g. "🛒")
 * - onQuickAddSubmit: function(payload) optional (wired later)
 */
export default function BudgetItem({
  type = "planned",
  item,
  icon = "💸",
  onQuickAddSubmit,
  budgetYear,
  budgetMonth,
}) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const title = useMemo(() => {
    if (!item) return "";
    return type === "planned" ? item.category : item.name;
  }, [item, type]);

  const statusStyles = useMemo(() => {
    // Keep styling logic minimal and based on backend status
    switch (item?.status) {
      case "over":
        return {
          badge: "bg-red-50 text-red-700 border-red-200",
          bar: "bg-red-500",
          hint: "text-red-700",
          hintText: "Te has pasado",
        };
      case "warning":
        return {
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          bar: "bg-amber-500",
          hint: "text-amber-700",
          hintText: "Ojo, te queda poco margen",
        };
      default:
        return {
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          bar: "bg-emerald-500",
          hint: "text-emerald-700",
          hintText: "Vas bien",
        };
    }
  }, [item?.status]);

  const progress = useMemo(() => {
    const raw = Number(item?.percentage_used ?? 0);
    // Cap visually at 100% so the bar doesn't overflow
    return Math.max(0, Math.min(100, raw));
  }, [item?.percentage_used]);

  const handleOpenQuickAdd = () => setIsQuickAddOpen(true);
  const handleCloseQuickAdd = () => setIsQuickAddOpen(false);

  // Later we’ll connect QuickAddExpense -> POST /api/expenses/ and then refetch budget
  const handleQuickAddSubmit = async (payload) => {
    if (typeof onQuickAddSubmit === "function") {
      await onQuickAddSubmit(payload);
    }
    handleCloseQuickAdd();
  };

  if (!item) return null;

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                {icon}
              </span>

              <h3 className="truncate text-base font-semibold text-gray-900">
                {title}
              </h3>

              {type === "recurring" && (
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${statusStyles.badge}`}
                >
                  Fijo
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {item.spent_amount} € / {item.planned_amount} €
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenQuickAdd}
            className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
            aria-label={`Añadir gasto a ${title}`}
            title="Añadir gasto"
          >
            +
          </button>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full ${statusStyles.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">{progress.toFixed(2)}%</span>
            <span className={statusStyles.hint}>
              {item.remaining_amount >= 0
                ? `Te quedan ${item.remaining_amount} €`
                : statusStyles.hintText}
            </span>
          </div>
        </div>
      </div>

      <QuickAddExpense
        isOpen={isQuickAddOpen}
        onClose={handleCloseQuickAdd}
        budgetYear={budgetYear}
        budgetMonth={budgetMonth}
        context={{
          name: title,
          type,
          categoryIcon: icon,
          categoryId: item.category,
          plannedExpenseId: type === "planned" ? item.id : null,
          recurringPaymentId: type === "recurring" ? item.id : null,
        }}
        onSubmit={handleQuickAddSubmit}
      />
    </>
  );
}