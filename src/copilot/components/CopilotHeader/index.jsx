import { memo } from "react";

function CopilotHeader({ stateLabel, onRefresh, refreshing }) {
  return (
    <header className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">Nilo</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]" aria-hidden="true" />
          <span className="truncate">{stateLabel}</span>
        </div>
      </div>
      <button type="button" onClick={onRefresh} disabled={refreshing} aria-label="Actualizar análisis de Nilo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.035] text-slate-400 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50">
        <svg viewBox="0 0 24 24" className={`h-4.5 w-4.5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66" /><path d="M20 4v7h-7" /></svg>
      </button>
    </header>
  );
}

export default memo(CopilotHeader);
