export default function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  loading = false,
  error = null,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="presentation" onClick={loading ? undefined : onCancel}>
      <div className="w-full rounded-t-[28px] border border-white/10 bg-[#0d1117] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-md sm:rounded-[28px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirmation-title" className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
        {error ? <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-100 disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="min-h-11 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Guardando…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
