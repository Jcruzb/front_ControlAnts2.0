import { useMemo, useState } from "react";
import QuickAddExpense from "./QuickAddExpense";
import { getPayerDisplayName } from "../utils/payers";

function getBudgetCardTitle(item, type) {
  if (!item) return "";

  if (typeof item?.name === "string" && item.name.trim()) {
    return item.name.trim();
  }

  if (typeof item?.category_detail?.name === "string" && item.category_detail.name.trim()) {
    return item.category_detail.name.trim();
  }

  if (typeof item?.category_name === "string" && item.category_name.trim()) {
    return item.category_name.trim();
  }

  if (typeof item?.category === "string" && item.category.trim()) {
    return item.category.trim();
  }

  if (type === "planned" && item?.category != null) {
    return String(item.category);
  }

  return "Sin categoría";
}

export default function BudgetItem({
  type = "planned",
  item,
  icon = "💸",
  onQuickAddSubmit,
  onQuickPayTotal,
  onQuickRevertTotal,
  quickActionLoading = null,
  canQuickRevert = false,
  budgetYear,
  budgetMonth,
  onOpenDetails,
  payers = [],
  payersError = null,
}) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const title = useMemo(() => {
    return getBudgetCardTitle(item, type);
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
  const payerName = item?.payer_detail ? getPayerDisplayName(item.payer_detail) : null;

  const handleQuickAddSubmit = async (payload) => {
    if (typeof onQuickAddSubmit === "function") {
      await onQuickAddSubmit(payload);
    }
    setIsQuickAddOpen(false);
  };

  if (!item) return null;

  const handleCardClick = (event) => {
    if (typeof onOpenDetails !== "function") return;

    if (
      event.target.closest(
        'button, a, input, select, textarea, [data-no-detail-open="true"]'
      )
    ) {
      return;
    }

    onOpenDetails(item, type);
  };

  const quickActionLabel =
    canQuickRevert === true ? "Revertir pago" : "Pagar total";
  const quickActionAriaLabel =
    canQuickRevert === true
      ? `Revertir pago de ${title}`
      : `Pagar total de ${title}`;
  const quickActionHandler =
    canQuickRevert === true ? onQuickRevertTotal : onQuickPayTotal;
  const quickActionPendingLabel =
    canQuickRevert === true ? "Revirtiendo..." : "Pagando...";

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group w-full min-w-0 max-w-full overflow-hidden rounded-[30px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm transition hover:border-white/12 hover:bg-white/[0.055] sm:p-5 ${
          typeof onOpenDetails === "function" ? "cursor-pointer" : ""
        }`}
      >
        <div className="mb-4 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-lg shadow-inner">
                {icon}
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold tracking-tight text-white">
                  {title}
                </h3>
                <p className="mt-1 break-words text-xs text-slate-400">
                  {item.spent_amount} € usados de {item.planned_amount} €
                </p>
                {payerName ? (
                  <p className="mt-1 text-xs text-slate-500">Paga: {payerName}</p>
                ) : null}
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

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
            {typeof quickActionHandler === "function" && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  quickActionHandler(item, type);
                }}
                disabled={quickActionLoading !== null}
                className={`w-full rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
                  canQuickRevert
                    ? "border border-white/10 bg-white/[0.05] text-slate-100 hover:border-white/20 hover:bg-white/[0.09]"
                    : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                }`}
                aria-label={quickActionAriaLabel}
              >
                {quickActionLoading !== null
                  ? quickActionPendingLabel
                  : quickActionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsQuickAddOpen(true);
              }}
              className="w-full shrink-0 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.1] active:scale-[0.98] sm:w-auto"
              aria-label={`Añadir gasto a ${title}`}
            >
              + gasto
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full ${statusStyles.bar}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">{progress.toFixed(2)}% consumido</span>
              <span className={`break-words text-right ${statusStyles.hint}`}>
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
          payer: item.payer,
        }}
        payers={payers}
        payersError={payersError}
        onSubmit={handleQuickAddSubmit}
      />
    </>
  );
}
