import { memo } from "react";

export const blockShell = "min-w-0 max-w-full rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-6";

export function CopilotSkeleton({ compact = false }) {
  return (
    <div className={`${blockShell} animate-pulse`} aria-label="Cargando bloque" role="status">
      <div className="h-3 w-24 rounded-full bg-white/10" />
      <div className="mt-4 h-6 w-3/4 rounded-full bg-white/10" />
      {!compact && <div className="mt-3 h-4 w-full rounded-full bg-white/[0.07]" />}
    </div>
  );
}

export function BlockMessage({ kind = "empty", title, message }) {
  const tone = {
    empty: "border-white/8 bg-white/[0.025] text-slate-400",
    error: "border-red-400/20 bg-red-500/10 text-red-200",
    permission: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  }[kind];

  return (
    <div className={`${blockShell} ${tone}`} role={kind === "error" ? "alert" : "status"}>
      <p className="font-semibold text-current">{title}</p>
      {message ? <p className="mt-1 text-sm opacity-80">{message}</p> : null}
    </div>
  );
}

export function BlockHeading({ title, description, eyebrow }) {
  return (
    <div className="min-w-0">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">{eyebrow}</p> : null}
      <h2 className="mt-1 break-words text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
      {description ? <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-400">{description}</p> : null}
    </div>
  );
}

const ACTION_STYLES = {
  primary: "border-blue-400/20 bg-blue-500 text-white hover:bg-blue-400",
  secondary: "border-white/10 bg-white/[0.07] text-slate-100 hover:bg-white/[0.11]",
  ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white",
};

export const ActionButton = memo(function ActionButton({ action, onAction, busy, blockId }) {
  const style = ACTION_STYLES[action?.style] || ACTION_STYLES.secondary;
  return (
    <button
      type="button"
      onClick={() => onAction?.(action, { blockId })}
      disabled={busy}
      className={`min-h-11 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d12] disabled:cursor-wait disabled:opacity-60 ${style}`}
    >
      {busy ? "Cargando…" : action?.label}
    </button>
  );
});

export function InlineActions({ actions, onAction, pendingActionId, blockId }) {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  return (
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Acciones disponibles">
      {actions.map((action, index) => (
        <ActionButton
          key={action.id || `${action.type}-${index}`}
          action={action}
          onAction={onAction}
          blockId={blockId}
          busy={pendingActionId === (action.id || `${blockId || "action"}:${action.type}`)}
        />
      ))}
    </div>
  );
}
