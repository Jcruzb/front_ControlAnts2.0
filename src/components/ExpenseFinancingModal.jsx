import { useEffect, useRef, useState } from "react";
import api, { getApiErrorMessage, unwrapCollectionResponse } from "../services/api";
import { parseAmount } from "../utils/amounts";
import { formatLocalDate } from "../utils/date";

const field = "mt-1 w-full min-w-0 rounded-xl border border-white/10 bg-[#11161d] p-3 text-white";
const money = (amount) => `${Number(amount).toFixed(2)} €`;
const snapshotFields = ["amount", "date", "category", "payer", "description", "planned_expense", "planned_expense_plan", "recurring_payment", "is_recurring", "month"];

function snapshot(expense) {
  return Object.fromEntries(snapshotFields.map((key) => [key,
    key === "amount" ? Number(expense.amount).toFixed(2) :
    key === "description" ? expense.description || "" :
    key === "is_recurring" ? Boolean(expense.is_recurring) : expense[key] ?? null,
  ]));
}

export default function ExpenseFinancingModal({ expense, categories, onClose, onSaved }) {
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState(null);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState({ name: expense.description || "Compra", total_amount: String(expense.amount), credit_account: "", category: expense.category ?? "", installment_count: "3", first_due_date: "" });
  const [review, setReview] = useState(null);
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const busyRef = useRef(false);
  const dialogRef = useRef(null);
  const paidCents = Math.round(Number(expense.amount) * 100);
  const total = parseAmount(form.total_amount);
  const remainingCents = Number.isFinite(total) ? Math.round(total * 100) - paidCents : NaN;
  const outstanding = remainingCents / 100;
  const locked = busy || Boolean(sent);
  const nextDate = new Date(`${expense.date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + 1);
  const firstAllowedDate = formatLocalDate(nextDate);

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus();
    return () => previous?.focus?.();
  }, []);
  useEffect(() => {
    let cancelled = false;
    api.get("/credit-accounts/").then((data) => {
      if (!cancelled) { setAccounts(unwrapCollectionResponse(data)); setAccountsError(null); }
    }).catch((err) => {
      if (!cancelled) setAccountsError(getApiErrorMessage(err, "No se pudieron cargar las tarjetas."));
    }).finally(() => { if (!cancelled) setAccountsLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  function prepare(event) {
    event.preventDefault();
    if (accountsLoading || accountsError) return;
    if (!Number.isFinite(total) || total <= 0 || remainingCents < 0) {
      setError("El total no puede ser menor que el importe ya pagado."); return;
    }
    if (!form.category) { setError("Selecciona la categoría de la compra. El gasto original conservará su categoría."); return; }
    if (remainingCents === 0 && !form.credit_account) {
      setError("Selecciona una tarjeta para vincular este pago completo, o indica un total mayor si queda deuda pendiente."); return;
    }
    const count = remainingCents > 0 ? Number(form.installment_count) : 0;
    if (remainingCents > 0 && (!Number.isInteger(count) || count < 1 || count > 360 || count > remainingCents)) {
      setError("Indica entre 1 y 360 cuotas pendientes, con al menos un céntimo por cuota."); return;
    }
    if (remainingCents > 0 && (!form.first_due_date || form.first_due_date <= expense.date)) {
      setError("La primera cuota pendiente debe ser posterior al pago ya registrado."); return;
    }
    setError(null);
    setReview({ name: form.name.trim(), credit_account: form.credit_account ? Number(form.credit_account) : null,
      ...(!expense.category ? { category: Number(form.category) } : {}), confirmed: true, total_amount: total.toFixed(2), installment_count: count,
      first_due_date: count ? form.first_due_date : null, expected_expense: snapshot(expense), idempotency_key: crypto.randomUUID() });
  }
  async function confirm() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null);
    const payload = sent || review;
    setSent(payload);
    let committed = false;
    try {
      const purchase = await api.post(`/expenses/${expense.id}/convert-to-financing/`, payload);
      committed = true;
      await onSaved(purchase);
    } catch (err) {
      const status = err?.response?.status;
      const definitive = !committed && status >= 400 && status < 500 && status !== 408 && status !== 429;
      if (definitive) setSent(null);
      setError(definitive
        ? getApiErrorMessage(err, "No se pudo convertir el gasto. Cierra y vuelve a abrirlo para revisar sus datos actuales.")
        : "No se pudo confirmar el resultado. Reintenta la misma conversión: no se volverá a contar el pago ni se duplicará la deuda.");
    } finally { busyRef.current = false; setBusy(false); }
  }
  function keyboard(event) {
    if (event.key === "Escape" && !locked) onClose();
    if (event.key !== "Tab") return;
    const nodes = dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]');
    const first = nodes[0]; const last = nodes[nodes.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
    <section ref={dialogRef} tabIndex={-1} onKeyDown={keyboard} role="dialog" aria-modal="true" aria-labelledby="conversion-title" className="max-h-[90dvh] w-full min-w-0 overflow-y-auto rounded-t-2xl bg-[#0d1117] p-5 text-white sm:max-w-xl sm:rounded-2xl">
      <h2 id="conversion-title" className="text-xl font-semibold">Convertir a tarjeta o financiación</h2>
      <p className="mt-3 break-words text-slate-300">{expense.description || "Gasto"} · {expense.date}</p>
      <p className="mt-2 text-emerald-200">Ya pagado: {money(expense.amount)}</p>
      <p className="my-3 text-sm text-slate-300">Este gasto seguirá contando una sola vez. Su importe, fecha, pagador y vínculos con el presupuesto se conservan. Solo el importe pendiente se repartirá en nuevas cuotas.</p>
      {(expense.recurring_payment || expense.planned_expense || expense.planned_expense_plan) && <p className="mb-3 text-sm text-amber-200">Se conserva su vínculo con el presupuesto. Esta conversión no cancela ni cambia los futuros pagos recurrentes o planificados; revísalos por separado si corresponde.</p>}
      {!review ? <form onSubmit={prepare} className="space-y-3">
        <label className="block">Nombre de la compra<input className={field} value={form.name} onChange={update("name")} maxLength={100} required /></label>
        <label className="block">Tarjeta o cuenta<select className={field} value={form.credit_account} onChange={update("credit_account")} disabled={accountsLoading || Boolean(accountsError)}><option value="">Sin tarjeta asociada</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        {accountsLoading ? <p role="status">Cargando tarjetas…</p> : accountsError ? <div role="alert"><p>{accountsError}</p><button type="button" className="mt-2 underline" onClick={() => { setAccountsLoading(true); setReload((value) => value + 1); }}>Volver a cargar tarjetas</button></div> : accounts.length === 0 && <p className="text-sm text-slate-400">Todavía no hay tarjetas. Puedes crear una en Financiaciones y volver a este gasto, o financiar sin tarjeta.</p>}
        {!expense.category && <label className="block">Categoría de la compra<select className={field} value={form.category} onChange={update("category")} required><option value="">Selecciona categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><span className="text-sm text-slate-400">El gasto original conserva su categoría actual.</span></label>}
        <label className="block">Total de la compra, incluido lo ya pagado (€)<input className={field} inputMode="decimal" value={form.total_amount} onChange={update("total_amount")} required /></label>
        <p className="text-sm text-slate-400">Incluye los intereses o comisiones acordados en el total. No se calculan automáticamente.</p>
        {Number.isFinite(outstanding) && outstanding >= 0 && <p className="text-lg">Deuda pendiente: {money(outstanding)}</p>}
        {remainingCents > 0 ? <div className="grid gap-3 sm:grid-cols-2">
          <label>Número de cuotas pendientes<input className={field} type="number" min="1" max="360" value={form.installment_count} onChange={update("installment_count")} required /></label>
          <label>Primera cuota pendiente<input className={field} type="date" min={firstAllowedDate} value={form.first_due_date} onChange={update("first_due_date")} required /></label>
        </div> : remainingCents === 0 && <p className="text-sm text-emerald-200">Pago completo: no se crearán cuotas pendientes ni deuda.</p>}
        <button disabled={accountsLoading || Boolean(accountsError)} className="rounded-xl bg-blue-500 px-4 py-3 font-semibold disabled:opacity-50">Revisar conversión</button>
      </form> : <div className="space-y-3">
        <h3 className="text-lg font-semibold">Revisa antes de confirmar</h3>
        <p className="break-words">{review.name}</p>
        <p>Tarjeta: {accounts.find((account) => account.id === review.credit_account)?.name || "Sin tarjeta asociada"}</p>
        <p>Total: {money(review.total_amount)} · Ya pagado: {money(expense.amount)} · Pendiente: {money(Number(review.total_amount) - Number(expense.amount))}</p>
        {review.installment_count ? <p>{review.installment_count} cuotas pendientes desde {review.first_due_date}. El redondeo se ajusta en la última cuota.</p> : <p>Sin cuotas pendientes.</p>}
        <p className="text-sm text-amber-200">No se registrará ningún gasto nuevo ni cambiará tu balance. El pago vinculado quedará protegido contra edición y eliminación.</p>
        {sent && <p role="status" className="text-sm text-slate-300">La solicitud queda bloqueada hasta verificar el resultado. Reintenta con estos mismos datos.</p>}
        <button disabled={busy} onClick={confirm} className="rounded-xl bg-blue-500 px-4 py-3 font-semibold disabled:opacity-50">{busy ? "Convirtiendo…" : sent ? "Reintentar misma conversión" : "Confirmar conversión"}</button>
        {!sent && <button disabled={busy} onClick={() => { setReview(null); setError(null); }} className="ml-3 text-slate-300">Corregir</button>}
      </div>}
      {error && <p role="alert" className="mt-3 text-red-200">{error}</p>}
      <button disabled={locked} onClick={onClose} className="mt-4 rounded-xl border border-white/10 px-4 py-3 text-slate-300 disabled:opacity-50">Cancelar</button>
    </section>
  </div>;
}
