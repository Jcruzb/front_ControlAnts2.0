import { useMemo } from "react";
import { getPayerDisplayName } from "../utils/payers";

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} €`;
}

function getPaymentTimestamp(value) {
  if (!value) return Number.NEGATIVE_INFINITY;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

export default function ExpenseDetailSheet({
  isOpen,
  title,
  subtitle = null,
  amount = null,
  meta = [],
  payments = [],
  loading = false,
  error = null,
  emptyMessage = "No hay pagos registrados.",
  onClose,
  onEditPayment,
  onDeletePayment,
  getPaymentCategoryLabel,
}) {
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const dateDiff = getPaymentTimestamp(b?.date) - getPaymentTimestamp(a?.date);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      const createdAtDiff =
        getPaymentTimestamp(b?.created_at) - getPaymentTimestamp(a?.created_at);
      if (createdAtDiff !== 0) {
        return createdAtDiff;
      }

      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [payments]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[88vh] overflow-hidden rounded-[32px] border border-white/10 bg-[#0d1117] shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-2xl sm:rounded-[28px]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-3 sm:hidden">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-white/10" />
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 pb-5 pt-4 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Detalle rápido</p>
            <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
            ) : null}
            {amount !== null ? (
              <p className="mt-3 text-xl font-semibold text-white">
                {formatCurrency(amount)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Cerrar detalle"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(88vh-108px)] overflow-y-auto px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
          {meta.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {meta.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className={meta.length > 0 ? "mt-6" : ""}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Pagos
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Historial
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                {sortedPayments.length}
              </span>
            </div>

            {loading ? (
              <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-400">
                Cargando detalle…
              </div>
            ) : error ? (
              <div className="mt-4 rounded-[24px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : sortedPayments.length === 0 ? (
              <div className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {sortedPayments.map((payment) => {
                  const categoryLabel = getPaymentCategoryLabel?.(payment) || null;
                  const payerName = payment?.payer_detail
                    ? getPayerDisplayName(payment.payer_detail)
                    : null;

                  return (
                    <div
                      key={payment.id}
                      className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {payment.description || "Pago"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            {payment.date ? <span>{payment.date}</span> : null}
                            {categoryLabel ? (
                              <span className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1">
                                {categoryLabel}
                              </span>
                            ) : null}
                            {payerName ? (
                              <span className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1">
                                Paga: {payerName}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-red-300">
                          − {formatCurrency(payment.amount)}
                        </p>
                      </div>

                      {(typeof onEditPayment === "function" ||
                        typeof onDeletePayment === "function") && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {typeof onEditPayment === "function" ? (
                            <button
                              type="button"
                              onClick={() => onEditPayment(payment)}
                              className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08]"
                            >
                              Editar
                            </button>
                          ) : null}
                          {typeof onDeletePayment === "function" ? (
                            <button
                              type="button"
                              onClick={() => onDeletePayment(payment)}
                              className="rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/14"
                            >
                              Eliminar
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
