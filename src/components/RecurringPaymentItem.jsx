import { useState, useRef, useEffect } from "react";

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
}) {
  const {
    name,
    amount,
    category,
    end_date,
    active,
  } = item;

  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    }

    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  const categoryInfo = categoryMap[category];

  return (
    <div
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-[30px] border p-4 transition sm:p-5 ${
        active
          ? "border-white/8 bg-white/[0.04] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
          : "border-white/8 bg-white/[0.025] shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
      }`}
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

          <div className="relative shrink-0" ref={actionsRef}>
            <button
              onClick={() => setShowActions((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Abrir opciones"
            >
              ⋯
            </button>

            {showActions && (
              <div className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#11161d] shadow-[0_24px_50px_rgba(0,0,0,0.45)]">
                <button
                  onClick={() => {
                    setShowActions(false);
                    onEdit(item);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]"
                >
                  Editar
                </button>

                {active ? (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onDeactivate(item.id);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                  >
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onReactivate(item.id);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-emerald-300 transition hover:bg-emerald-500/10"
                  >
                    Reactivar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
