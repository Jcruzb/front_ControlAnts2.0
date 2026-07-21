import { memo, useState } from "react";

function ConversationInput({ onSubmit, disabled, error }) {
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const value = message.trim();
    if (!value || disabled) return;
    onSubmit?.(value);
    setMessage("");
  }

  return (
    <section aria-labelledby="conversation-title">
      <div className="mb-3">
        <h2 id="conversation-title" className="text-sm font-semibold text-slate-200">¿Qué quieres revisar?</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Nilo responde con los datos que ControlAnts ya conoce.</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/10 bg-[rgba(14,19,28,0.88)] p-2 shadow-[0_18px_55px_rgba(0,0,0,0.28)] focus-within:border-blue-400/30 focus-within:ring-1 focus-within:ring-blue-400/15">
        <label htmlFor="copilot-message" className="sr-only">Pregunta para Nilo</label>
        <div className="flex min-w-0 items-end gap-2">
          <textarea id="copilot-message" value={message} onChange={(event) => setMessage(event.target.value)} disabled={disabled} rows={1} maxLength={200} placeholder="Pregúntale a Nilo…" className="max-h-28 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-3 text-[15px] leading-5 text-white outline-none placeholder:text-slate-600 disabled:opacity-60" />
          <button type="submit" disabled={disabled || !message.trim()} aria-label="Enviar pregunta a Nilo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.32)] transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="m5 12 14-7-5 14-2-5-7-2Z" /><path d="m12 14 7-9" /></svg>
          </button>
        </div>
      </form>
      {error ? <p className="mt-2 text-sm text-red-300" role="alert">{error}</p> : <p className="mt-2 text-xs text-slate-600">Prueba: “¿Cómo vamos este mes?”</p>}
    </section>
  );
}

export default memo(ConversationInput);
