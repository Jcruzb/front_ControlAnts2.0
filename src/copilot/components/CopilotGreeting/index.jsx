import { memo } from "react";

function CopilotGreeting({ name, periodLabel, summary, description, loading }) {
  return (
    <section className="relative mx-auto w-full max-w-xl rounded-[24px] border border-white/9 bg-[linear-gradient(145deg,rgba(22,29,42,0.92),rgba(10,14,22,0.86))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.3)] sm:p-6" aria-live="polite">
      <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-white/9 bg-[#151c29]" aria-hidden="true" />
      <p className="text-lg font-semibold tracking-tight text-white">Hola {name} <span aria-hidden="true">👋</span></p>
      {loading ? (
        <div className="mt-3 space-y-2" role="status" aria-label="Nilo está revisando tu economía"><div className="h-4 w-4/5 animate-pulse rounded-full bg-white/8" /><div className="h-4 w-3/5 animate-pulse rounded-full bg-white/6" /></div>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-slate-400">He revisado tu economía de {periodLabel}.</p>
          {summary ? <p className="mt-4 text-balance text-xl font-semibold leading-snug tracking-[-0.02em] text-slate-50 sm:text-2xl">{summary}</p> : null}
          {description && description !== summary ? <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p> : null}
        </>
      )}
    </section>
  );
}

export default memo(CopilotGreeting);
