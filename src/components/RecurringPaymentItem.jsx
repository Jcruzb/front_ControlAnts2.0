import CardActionsMenu from "./CardActionsMenu";
import { getPayerDisplayName } from "../utils/payers";

/**
 * RecurringPaymentItem
 * --------------------
 * Representa un gasto fijo dentro de la lista de Gastos fijos.
 *
 * Props:
 * - item: {
 *     id,
 *     name,
 *     amount,
 *     category,
 *     start_date,
 *     end_date,
 *     active
 *   }
 * - onEdit: function(item)
 * - onDeactivate: function(id)
 * - onReactivate: function(id)
 * - categoryMap: { [id]: { name, icon } }
 */

export default function RecurringPaymentItem({
  item,
  onEdit,
  onDeactivate,
  onReactivate = () => {},
  categoryMap = {},
  onOpenDetails,
}) {
  const {
    name,
    amount,
    category,
    end_date,
    active,
  } = item;

  const categoryInfo = categoryMap[category];
  const payerName = item?.payer_detail ? getPayerDisplayName(item.payer_detail) : null;
  const actionLabel = active ? "Desactivar" : "Reactivar";
  const handleSecondaryAction = () => {
    if (active) {
      onDeactivate(item.id);
      return;
    }

    onReactivate(item.id);
  };
  const handleCardClick = (event) => {
    if (typeof onOpenDetails !== "function") return;

    if (
      event.target.closest(
        'button, a, input, select, textarea, [data-no-detail-open="true"]'
      )
    ) {
      return;
    }

    onOpenDetails(item);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`w-full min-w-0 max-w-full rounded-[30px] border p-4 transition sm:p-5 ${
          active
            ? "border-white/8 bg-white/[0.04] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            : "border-white/8 bg-white/[0.025] shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
        } ${typeof onOpenDetails === "function" ? "cursor-pointer hover:border-white/12" : ""}`}
      >
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className={`flex min-w-0 items-start gap-4 ${!active ? "opacity-65" : ""}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl">
              {categoryInfo?.icon || "💸"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-white">
                {name}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {categoryInfo?.name || "Sin categoría"}
              </p>
              {payerName ? (
                <p className="mt-1 text-xs text-slate-500">Paga: {payerName}</p>
              ) : null}
              <div className="mt-2">
                <span className="inline-flex rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-xs font-medium text-slate-400">
                  {end_date
                    ? `Hasta ${new Date(end_date).toLocaleDateString()}`
                    : "Sin fecha de fin"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-row items-start justify-between gap-3 sm:ml-4 sm:w-auto sm:flex-col sm:items-end">
            <p className="text-xl font-semibold tracking-tight text-white">
              {Number(amount).toFixed(2)} €
            </p>

            {!active && (
              <span className="rounded-full border border-amber-400/20 bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-200">
                Inactivo
              </span>
            )}

            <CardActionsMenu
              title={name}
              subtitle={categoryInfo?.name || "Sin categoría"}
              actions={[
                {
                  label: "Editar",
                  onSelect: () => onEdit(item),
                },
                {
                  label: actionLabel,
                  tone: active ? "danger" : "success",
                  onSelect: handleSecondaryAction,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
