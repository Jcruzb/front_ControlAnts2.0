import { useState } from "react";
import { parseAmount } from "../utils/amounts";

export default function AdjustIncomePlanModal({ isOpen, item, budgetYear, budgetMonth, onClose, onSubmit, loading = false, error }) {
  const [amount, setAmount] = useState(String(item?.planned_amount ?? ""));
  const [effectiveMonth, setEffectiveMonth] = useState(`${budgetYear}-${String(budgetMonth).padStart(2, "0")}`);
  const [validation, setValidation] = useState(null);
  if (!isOpen || !item) return null;
  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    const parsed = parseAmount(amount);
    const [year, month] = effectiveMonth.split("-").map(Number);
    if (!Number.isFinite(parsed) || parsed <= 0 || !year || month < 1 || month > 12) {
      setValidation("Introduce un importe positivo y un mes válido");
      return;
    }
    setValidation(null);
    await onSubmit({ amount: parsed.toFixed(2), year, month });
  }
  const inputClass = "mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white";
  return <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3 sm:items-center sm:justify-center">
    <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="change-income-title" className="w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0d1117] p-5 sm:max-w-md sm:rounded-2xl space-y-4">
      <h3 id="change-income-title" className="text-lg font-semibold text-white">Cambiar importe previsto</h3>
      <p className="break-words text-slate-300">{item.name}</p>
      <label className="block text-sm text-slate-200">Nuevo importe previsto
        <input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
      <label className="block text-sm text-slate-200">Desde el mes
        <input className={inputClass} type="month" value={effectiveMonth} onChange={(e) => setEffectiveMonth(e.target.value)} required />
      </label>
      <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        El importe previsto será {Number.isFinite(parseAmount(amount)) ? parseAmount(amount).toFixed(2) : "—"} € desde {effectiveMonth}, hasta el siguiente cambio ya programado o el final del plan. No se registrará ningún cobro ni se modificarán cobros existentes.
      </p>
      {(validation || error) && <p role="alert" className="text-sm text-red-200">{validation || error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button disabled={loading} className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{loading ? "Guardando..." : "Confirmar cambio previsto"}</button>
        <button type="button" disabled={loading} onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-3 text-slate-200 disabled:opacity-50">Cancelar</button>
      </div>
    </form>
  </div>;
}
