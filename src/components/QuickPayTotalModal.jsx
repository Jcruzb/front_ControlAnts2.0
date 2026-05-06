import { useState } from "react";
import PayerSelect from "./PayerSelect";

export default function QuickPayTotalModal({
  isOpen,
  item = null,
  title = "",
  amount = 0,
  defaultPayer = "",
  payers = [],
  payersError = null,
  loading = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const [payer, setPayer] = useState(
    defaultPayer !== null && defaultPayer !== undefined
      ? String(defaultPayer)
      : ""
  );

  if (!isOpen || !item) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit?.({ payer });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full rounded-t-2xl border border-white/10 bg-[#0d1117] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-md sm:rounded-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Pagar total</p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Se registrará un pago por{" "}
              <strong className="text-white">{Number(amount || 0).toFixed(2)} €</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <PayerSelect
              value={payer}
              onChange={setPayer}
              payers={payers}
              disabled={loading}
              placeholder="Sin seleccionar"
            />
            {payersError ? (
              <p className="mt-2 text-xs text-amber-200">
                {payersError}. Puedes registrar el pago sin seleccionar pagador.
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Registrar pago"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
