import { useEffect, useRef, useState } from "react";

function getStatusMeta(status) {
  switch (status) {
    case "RESOLVED":
      return {
        badge: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
        label: "Resuelto",
      };
    case "MISSING_VERSION":
      return {
        badge: "bg-amber-500/12 text-amber-200 border-amber-400/20",
        label: "Falta versión",
      };
    default:
      return {
        badge: "bg-slate-500/12 text-slate-200 border-white/10",
        label: "Pendiente",
      };
  }
}

export default function IncomePlanMonthItem({
  item,
  onConfirm,
  onAdjust,
  onEdit,
  onDelete,
  loadingAction = null,
  disabled = false,
}) {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);
  const status = item?.status || "PENDING";
  const statusMeta = getStatusMeta(status);
  const resolvedIncome = item?.resolved_income || null;
  const plannedAmount = item?.planned_amount ?? 0;
  const canResolve = item?.can_resolve !== false && !disabled;
  const categoryName = item?.category_detail?.name || item?.category || "Sin categoría";

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

  return (
    <article className="rounded-[30px] border border-white/8 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-white">
              {item?.name || "Sueldo planificado"}
            </h3>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusMeta.badge}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            + {Number(plannedAmount || 0).toFixed(2)} €
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Planificado: {Number(plannedAmount || 0).toFixed(2)} €
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {categoryName}
            {item?.due_day ? ` · Día ${item.due_day}` : ""}
          </p>
        </div>

        <div className="relative shrink-0" ref={actionsRef}>
          <button
            type="button"
            onClick={() => setShowActions((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Abrir opciones"
          >
            ⋯
          </button>

          {showActions && (
            <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#11161d] shadow-[0_24px_50px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                onClick={() => {
                  setShowActions(false);
                  onEdit?.(item);
                }}
                className="w-full px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowActions(false);
                  onDelete?.(item);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {status === "RESOLVED" && resolvedIncome ? (
        <div className="mt-4 rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-medium">
            Confirmado: + {Number(resolvedIncome.amount || 0).toFixed(2)} €
          </p>
          <p className="mt-1 text-xs text-emerald-200/80">
            {resolvedIncome.date}
            {resolvedIncome.description ? ` · ${resolvedIncome.description}` : ""}
          </p>
        </div>
      ) : null}

      {status === "MISSING_VERSION" ? (
        <div className="mt-4 rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          No existe una versión activa para este sueldo en el mes seleccionado.
        </div>
      ) : null}

      {status === "PENDING" ? (
        <div className="mt-4">
          {!canResolve ? (
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
              Este mes está cerrado o no permite resolver sueldos desde el frontend.
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => onConfirm(item)}
                disabled={loadingAction === "confirm"}
                className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
              >
                {loadingAction === "confirm" ? "Confirmando..." : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => onAdjust(item)}
                disabled={loadingAction === "adjust"}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Ajustar
              </button>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
