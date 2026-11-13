import { useEffect, useRef, useState } from "react";
import api, { getApiErrorMessage, unwrapCollectionResponse } from "../../../services/api";
import { parseAmount } from "../../../utils/amounts";

const fieldClass = "mt-1 w-full min-w-0 rounded-xl border border-white/15 bg-[#11161d] p-3 text-white";
const actionClass = "rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white disabled:opacity-50";

// Mounted with an identity/period key: drafts never cross family or month boundaries.
export default function MovementRegistration({ year, month, onRecorded }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmationAttempted, setConfirmationAttempted] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);
  const mounted = useRef(true);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    mounted.current = true;
    api.get("/categories/").then((data) => {
      if (mounted.current) setCategories(unwrapCollectionResponse(data));
    }).catch((err) => { if (mounted.current) setError(getApiErrorMessage(err)); });
    return () => {
      mounted.current = false;
      if (recognition.current) {
        recognition.current.onresult = null;
        recognition.current.onend = null;
        recognition.current.onerror = null;
        recognition.current.abort();
      }
    };
  }, []);

  function dictate() {
    if (listening) { recognition.current?.stop(); return; }
    if (!SpeechRecognition) return;
    const recorder = new SpeechRecognition();
    recorder.lang = "es-ES";
    recorder.interimResults = false;
    recorder.continuous = false;
    recorder.onresult = (event) => {
      const transcript = Array.from(event.results).filter((result) => result.isFinal).map((result) => result[0].transcript).join(" ");
      if (mounted.current) setText((current) => `${current}${current ? "\n" : ""}${transcript}`.slice(0, 4000));
    };
    recorder.onerror = () => { if (mounted.current) { setError("No se pudo dictar. Puedes escribir o pegar el texto."); setListening(false); } };
    recorder.onend = () => { if (mounted.current) setListening(false); };
    recognition.current = recorder;
    setError(null);
    try { recorder.start(); setListening(true); } catch { setError("No se pudo iniciar el micrófono."); }
  }

  async function perform(action) {
    if (busy) return;
    setBusy(true); setError(null); setSuccess(null);
    try { await action(); } catch (err) { if (mounted.current) setError(getApiErrorMessage(err, "No se pudo preparar el registro.")); }
    finally { if (mounted.current) setBusy(false); }
  }

  function update(index, key, value) {
    setRows((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
    setProposal(null);
  }

  const validRows = rows.length > 0 && rows.length <= 20 && rows.every((row) =>
    ["expense", "income"].includes(row.kind) && Number.isFinite(parseAmount(row.amount)) && parseAmount(row.amount) > 0 && row.category && row.date
  );

  return <section className="mt-9 min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6" aria-labelledby="movement-registration-title">
    <h2 id="movement-registration-title" className="text-lg font-semibold text-white">Registrar con Nilo</h2>
    <p className="mt-2 text-sm text-slate-400">Escribe varios ingresos o gastos, uno por línea. Primero revisas los datos; solo se guardan al confirmar el conjunto.</p>
    {!proposal && <>
      <label className="mt-4 block text-sm text-slate-200">Movimientos en texto
        <textarea className={fieldClass} rows={4} maxLength={4000} value={text} disabled={busy || listening} onChange={(e) => setText(e.target.value)} placeholder="Gasto 25,50 en Supermercado; ingreso 100 en Otros" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={actionClass} disabled={busy || listening || !text.trim()} onClick={() => perform(async () => {
          const data = await api.post("/assistant/movement-drafts/", { text, year, month });
          if (mounted.current) { setRows(data.rows || []); setProposal(null); }
        })}>{busy ? "Preparando…" : "Interpretar y revisar"}</button>
        {SpeechRecognition ? <button className="rounded-xl border border-white/15 px-4 py-3 text-slate-200" disabled={busy} onClick={dictate}>{listening ? "Detener dictado" : "Dictar movimientos"}</button> : <p className="self-center text-xs text-slate-500">El dictado no está disponible en este navegador. Puedes usar el dictado del teclado.</p>}
      </div>
      {SpeechRecognition && <p className="mt-2 text-xs text-slate-500">El navegador gestiona el reconocimiento de voz y puede usar su servicio de transcripción. El texto siempre queda editable antes de revisarlo.</p>}
      <div className="mt-4 space-y-4">{rows.map((row, index) => <fieldset key={index} disabled={busy} className="min-w-0 rounded-xl border border-white/10 p-3">
        <legend className="px-2 text-sm text-slate-300">Movimiento {index + 1}</legend>
        {row.errors?.length > 0 && <p className="text-sm text-amber-200">Revisa los campos de esta fila antes de continuar.</p>}
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Tipo<select className={fieldClass} value={row.kind || ""} onChange={(e) => update(index, "kind", e.target.value)}><option value="">Selecciona</option><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label>
          <label className="text-sm text-slate-300">Importe<input className={fieldClass} inputMode="decimal" value={row.amount ?? ""} onChange={(e) => update(index, "amount", e.target.value)} /></label>
          <label className="text-sm text-slate-300">Fecha<input className={fieldClass} type="date" value={row.date || ""} onChange={(e) => update(index, "date", e.target.value)} /></label>
          <label className="text-sm text-slate-300">Categoría<select className={fieldClass} value={row.category || ""} onChange={(e) => update(index, "category", Number(e.target.value) || null)}><option value="">Selecciona la categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-sm text-slate-300 sm:col-span-2">Descripción<input className={fieldClass} value={row.description || ""} onChange={(e) => update(index, "description", e.target.value)} /></label>
          <label className="text-sm text-slate-300 sm:col-span-2">Alias de categoría (opcional)<input className={fieldClass} value={row.alias || ""} onChange={(e) => update(index, "alias", e.target.value)} /></label>
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-slate-300"><input type="checkbox" checked={Boolean(row.learn_alias)} disabled={!row.alias?.trim()} onChange={(e) => update(index, "learn_alias", e.target.checked)} />Recordar este alias para mi familia al confirmar</label>
        <button className="mt-3 text-sm text-red-300" onClick={() => setRows((current) => current.filter((_, i) => i !== index))}>Quitar movimiento {index + 1}</button>
      </fieldset>)}</div>
      {rows.length > 0 && <button className={`${actionClass} mt-4`} disabled={busy || !validRows} onClick={() => perform(async () => {
        const movements = rows.map((row) => ({ kind: row.kind, amount: parseAmount(row.amount).toFixed(2), date: row.date, category: Number(row.category), description: row.description || "", ...(row.learn_alias && row.alias?.trim() ? { alias: row.alias.trim(), learn_alias: true } : {}) }));
        const data = await api.post("/assistant/movement-proposals/", { movements });
        if (mounted.current) { setProposal(data); setConfirmationAttempted(false); }
      })}>Revisar confirmación final</button>}
    </>}
    {proposal && <div className="mt-4 space-y-4">
      <p className="text-sm text-amber-200">Vas a registrar {proposal.movements.length} movimientos. Comprueba importes, categorías y fechas. No se modifica ninguna planificación.</p>
      <ul className="space-y-2">{proposal.movements.map((row, index) => <li key={index} className="break-words rounded-xl bg-black/20 p-3 text-sm text-slate-200">
        {row.kind === "income" ? "Ingreso" : "Gasto"} · {row.amount} € · {row.date} · {categories.find((category) => category.id === row.category)?.name || row.category}<br />{row.description}
        {row.learn_alias && <p className="mt-1 text-amber-200">Recordar alias: {row.alias}</p>}
      </li>)}</ul>
      <p className="text-xs text-slate-500">Confirmación válida hasta {new Date(proposal.expires_at).toLocaleTimeString()}.</p>
      {confirmationAttempted && <p className="text-sm text-amber-200">Si se perdió la respuesta, vuelve a confirmar esta misma propuesta: no se duplicarán los movimientos. Hasta resolverla no se puede editar ni crear otra.</p>}
      <div className="flex flex-wrap gap-2">
        <button className={actionClass} disabled={busy} onClick={() => perform(async () => {
          setConfirmationAttempted(true);
          await api.post(`/assistant/movement-proposals/${proposal.id}/confirm/`, { confirmed: true });
          if (mounted.current) { setSuccess("Movimientos registrados. El balance ya incluye estos cobros y pagos."); setProposal(null); setRows([]); setText(""); onRecorded?.(); }
        })}>{busy ? "Guardando…" : "Confirmar y registrar movimientos"}</button>
        <button className="rounded-xl border border-white/15 px-4 py-3 text-slate-200" disabled={busy || confirmationAttempted} onClick={() => setProposal(null)}>Volver a editar</button>
        <button className="rounded-xl border border-white/15 px-4 py-3 text-slate-200" disabled={busy || confirmationAttempted} onClick={() => { setProposal(null); setRows([]); }}>Cancelar registro</button>
      </div>
    </div>}
    {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
    {success && <p role="status" className="mt-4 text-sm text-emerald-300">{success}</p>}
  </section>;
}
