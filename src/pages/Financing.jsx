import { useEffect, useState } from "react";
import api, { getApiErrorMessage, unwrapCollectionResponse } from "../services/api";
import { getCategories } from "../services/categories";
import { getFamilyMembers } from "../services/familyMembers";
import { useAuth } from "../hooks/useAuth";
import { parseAmount } from "../utils/amounts";
import { getTodayLocalDate } from "../utils/date";
import { getPayerDisplayName } from "../utils/payers";

const field = "mt-1 w-full min-w-0 rounded-xl border border-white/10 bg-[#11161d] p-3 text-white";
const button = "rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50";
const money = (amount) => `${Number(amount).toFixed(2)} €`;

export function FinancingPaymentForm({ payment, members, onClose, onSaved }) {
  const [form, setForm] = useState({ amount: payment.row.pending_amount, date: getTodayLocalDate(), payer: "" });
  const [review, setReview] = useState(false);
  const [sent, setSent] = useState(null);
  const [key] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  function reviewPayment(event) {
    event.preventDefault();
    const amount = parseAmount(form.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(payment.row.pending_amount)) {
      setError("El pago debe ser positivo y no superar el pendiente"); return;
    }
    setError(null); setReview(true);
  }
  async function confirm() {
    if (loading) return;
    const payload = sent || { amount: parseAmount(form.amount).toFixed(2), date: form.date, ...(form.payer ? { payer: Number(form.payer) } : {}), idempotency_key: key };
    setSent(payload); setLoading(true); setError(null);
    try {
      await api.post(`/financing-installments/${payment.row.id}/payments/`, payload);
      await onSaved();
    } catch (err) { setError(getApiErrorMessage(err, "No se pudo confirmar el pago. Reintenta con los mismos datos.")); }
    finally { setLoading(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
    <section role="dialog" aria-modal="true" aria-labelledby="payment-title" className="w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-[#0d1117] p-5 sm:max-w-md sm:rounded-2xl">
      <h2 id="payment-title" className="text-xl font-semibold text-white">Registrar pago · cuota {payment.row.number}</h2>
      <p className="my-3 text-slate-300">{payment.name} · pendiente {money(payment.row.pending_amount)}</p>
      {!review ? <form onSubmit={reviewPayment} className="space-y-3">
        <label className="block text-slate-300">Importe pagado<input className={field} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
        <label className="block text-slate-300">Fecha del pago<input className={field} type="date" min={payment.purchaseDate} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
        <label className="block text-slate-300">Quién paga<select className={field} value={form.payer} onChange={(e) => setForm({ ...form, payer: e.target.value })}><option value="">Yo</option>{members.map((m) => <option key={m.id} value={m.id}>{getPayerDisplayName(m)}</option>)}</select></label>
        <button className={button}>Revisar pago</button>
      </form> : <div className="space-y-4">
        <p className="text-slate-200">Se registrará un gasto real de {money(form.amount.replace(",", "."))} el {form.date}. Reducirá esta cuota y el balance de ese mes una sola vez.</p>
        <p className="text-sm text-amber-200">Los pagos de financiación quedan protegidos frente a edición y eliminación en Gastos. Comprueba los datos antes de confirmar.</p>
        <button className={button} disabled={loading} onClick={confirm}>{loading ? "Registrando…" : sent ? "Reintentar mismo pago" : "Confirmar pago"}</button>
        {!sent && <button onClick={() => setReview(false)} className="ml-3 text-slate-300">Corregir</button>}
      </div>}
      {error && <p role="alert" className="mt-3 text-red-200">{error}</p>}
      <button onClick={onClose} disabled={loading} className="mt-4 text-slate-300">Cerrar</button>
    </section>
  </div>;
}

export default function Financing() {
  const { profile } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cardName, setCardName] = useState("");
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", credit_account: "", total_amount: "", installment_count: "3", purchase_date: getTodayLocalDate(), first_due_date: getTodayLocalDate() });
  async function refresh() {
    const [p, a] = await Promise.all([api.get("/financed-purchases/"), api.get("/credit-accounts/")]);
    setPurchases(unwrapCollectionResponse(p)); setAccounts(unwrapCollectionResponse(a));
  }
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get("/financed-purchases/"), api.get("/credit-accounts/"), getCategories(), getFamilyMembers()]).then(([p, a, c, m]) => {
      if (cancelled) return;
      setPurchases(unwrapCollectionResponse(p)); setAccounts(unwrapCollectionResponse(a)); setCategories(c); setMembers(m);
    }).catch((err) => { if (!cancelled) setError(getApiErrorMessage(err, "No se pudieron cargar las financiaciones")); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  async function create(event, isCard) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError(null);
    try {
      if (isCard) { await api.post("/credit-accounts/", { name: cardName }); setCardName(""); }
      else {
        const amount = parseAmount(form.total_amount);
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Introduce un importe válido");
        await api.post("/financed-purchases/", { ...form, category: Number(form.category), credit_account: form.credit_account ? Number(form.credit_account) : null, total_amount: amount.toFixed(2), installment_count: Number(form.installment_count) });
        setForm({ ...form, name: "", total_amount: "" });
      }
      await refresh();
    } catch (err) { setError(getApiErrorMessage(err, err.message || "No se pudo guardar")); }
    finally { setSaving(false); }
  }
  const update = (name) => (e) => setForm({ ...form, [name]: e.target.value });
  if (loading) return <p className="p-5 text-slate-300">Cargando financiaciones…</p>;
  return <main className="mx-auto max-w-5xl space-y-6 p-4 text-white">
    <h1 className="text-2xl font-semibold">Tarjetas y compras financiadas</h1>
    <p className="text-slate-300">La compra crea deuda pendiente. Solo los pagos registrados son gastos reales. Introduce el total a devolver, incluidos intereses o comisiones acordados; no se calculan automáticamente.</p>
    <p className="text-xl">Deuda pendiente: {money(purchases.reduce((sum, p) => sum + Number(p.outstanding_amount), 0))}</p>
    {error && <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-red-200">{error}</p>}
    {profile?.role === "admin" && <details className="rounded-2xl border border-white/10 p-4"><summary className="cursor-pointer font-semibold">Añadir tarjeta o compra</summary>
      <form onSubmit={(e) => create(e, true)} className="my-4 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1">Nombre de tarjeta o cuenta<input maxLength={100} className={field} value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Solo un nombre, sin número de tarjeta" required /></label><button disabled={saving} className={button}>Crear tarjeta</button></form>
      <form onSubmit={(e) => create(e, false)} className="grid gap-4 sm:grid-cols-2">
        <label>Compra<input className={field} value={form.name} onChange={update("name")} maxLength={100} required /></label>
        <label>Categoría<select className={field} value={form.category} onChange={update("category")} required><option value="">Selecciona categoría</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Tarjeta o cuenta (opcional)<select className={field} value={form.credit_account} onChange={update("credit_account")}><option value="">Sin tarjeta asociada</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label>Total a devolver (€)<input className={field} inputMode="decimal" value={form.total_amount} onChange={update("total_amount")} required /></label>
        <label>Fecha de compra<input className={field} type="date" value={form.purchase_date} onChange={update("purchase_date")} required /></label>
        <label>Primera cuota<input className={field} type="date" min={form.purchase_date} value={form.first_due_date} onChange={update("first_due_date")} required /></label>
        <label>Número de cuotas mensuales<input className={field} type="number" min="1" max="360" value={form.installment_count} onChange={update("installment_count")} required /></label>
        <div className="self-end"><p className="mb-2 text-sm text-slate-400">No se registra ningún gasto al crear. El redondeo se ajusta en la última cuota.</p><button disabled={saving} className={button}>Crear compra y calendario</button></div>
      </form>
    </details>}
    {purchases.length === 0 && <p className="text-slate-400">No hay compras financiadas.</p>}
    {purchases.map((purchase) => <section key={purchase.id} className="min-w-0 rounded-2xl border border-white/10 p-4">
      <h2 className="break-words text-lg font-semibold">{purchase.name}</h2>
      <p className="mt-2 text-slate-300">Total {money(purchase.total_amount)} · Pagado {money(purchase.paid_amount)} · Pendiente {money(purchase.outstanding_amount)}</p>
      <details className="mt-3"><summary className="cursor-pointer text-emerald-300">Ver calendario de cuotas</summary><ul className="mt-3 space-y-3">{purchase.installments.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"><div><p>Cuota {row.number} · {row.due_date}</p><p className="text-sm text-slate-400">Previsto {money(row.amount)} · Pagado {money(row.paid_amount)} · Pendiente {money(row.pending_amount)}</p></div>{Number(row.pending_amount) > 0 ? <button className={button} onClick={() => setPayment({ row, name: purchase.name, purchaseDate: purchase.purchase_date })}>Registrar pago</button> : <span className="text-emerald-300">Pagada</span>}</li>)}</ul></details>
    </section>)}
    {payment && <FinancingPaymentForm payment={payment} members={members} onClose={() => setPayment(null)} onSaved={async () => { setPayment(null); await refresh(); }} />}
  </main>;
}
