import { useMemo, useState } from "react";
import QuickAddExpense from "./QuickAddExpense";

export default function BudgetItem({
  type = "planned",
  item,
  icon = "💸",
  onQuickAddSubmit,
  onQuickPayTotal,
  budgetYear,
  budgetMonth,
}) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const title = useMemo(() => {
    if (!item) return "";
    return type === "planned" ? item.category : item.name;
  }, [item, type]);

  const statusStyles = useMemo(() => {
    switch (item?.status) {
      case "over":
        return {
          badge: "bg-red-500/12 text-red-200 border-red-400/20",
          bar: "bg-red-400",
          hint: "text-red-300",
          hintText: "Te has pasado",
        };
      case "warning":
        return {
          badge: "bg-amber-500/12 text-amber-200 border-amber-400/20",
          bar: "bg-amber-400",
          hint: "text-amber-300",
          hintText: "Ojo, te queda poco margen",
        };
      default:
        return {
          badge: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
          bar: "bg-emerald-400",
          hint: "text-emerald-300",
          hintText: "Vas bien",
        };
      }
  }, [item?.status]);

  const progress = useMemo(() => {
    const raw = Number(item?.percentage_used ?? 0);
    return Math.max(0, Math.min(100, raw));
  }, [item?.percentage_used]);

  const handleQuickAddSubmit = async (payload) => {
    if (typeof onQuickAddSubmit === "function") {
      await onQuickAddSubmit(payload);
    }
    setIsQuickAddOpen(false);
  };

  if (!item) return null;

  return (
    <>
      <div className="group rounded-[30px] border border-white/8 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm transition hover:border-white/12 hover:bg-white/[0.055]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-lg shadow-inner">
                {icon}
              </span>

              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-tight text-white">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {item.spent_amount} € usados de {item.planned_amount} €
                </p>
              </div>

              {type === "recurring" && (
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles.badge}`}
                >
                  Fijo
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            {typeof onQuickPayTotal === "function" && (
              <button
                type="button"
                onClick={() => onQuickPayTotal(item, type)}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 active:scale-[0.98]"
                aria-label={`Pagar total de ${title}`}
              >
                Pagar total
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.1] active:scale-[0.98]"
              aria-label={`Añadir gasto a ${title}`}
            >
              + gasto
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full ${statusStyles.bar}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">{progress.toFixed(2)}% consumido</span>
              <span className={statusStyles.hint}>
                {item.remaining_amount >= 0
                  ? `${item.remaining_amount} € disponibles`
                  : statusStyles.hintText}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Restante
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {item.remaining_amount} €
            </p>
          </div>
        </div>
      </div>

      <QuickAddExpense
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
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
