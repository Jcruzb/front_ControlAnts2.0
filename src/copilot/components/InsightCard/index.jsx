import { memo } from "react";
import { InlineActions } from "../shared/BlockPrimitives";

const TONES = {
  info: { icon: "i", shell: "border-blue-400/15 bg-blue-500/[0.055]", iconClass: "bg-blue-500/12 text-blue-200" },
  success: { icon: "✓", shell: "border-emerald-400/15 bg-emerald-500/[0.055]", iconClass: "bg-emerald-500/12 text-emerald-200" },
  warning: { icon: "!", shell: "border-amber-400/15 bg-amber-500/[0.055]", iconClass: "bg-amber-500/12 text-amber-100" },
  critical: { icon: "!", shell: "border-red-400/15 bg-red-500/[0.055]", iconClass: "bg-red-500/12 text-red-100" },
  recommendation: { icon: "✦", shell: "border-violet-400/15 bg-violet-500/[0.055]", iconClass: "bg-violet-500/12 text-violet-100" },
};

function InsightCard({ number, eyebrow, title, explanation, tone = "info", actions, onAction, pendingActionId, blockId, role, children }) {
  const visual = TONES[tone] || TONES.info;
  return (
    <article className={`copilot-enter group min-w-0 rounded-[22px] border p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/14 sm:p-5 ${visual.shell}`} role={role}>
      <div className="flex min-w-0 items-start gap-3.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${visual.iconClass}`} aria-hidden="true">{visual.icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">{eyebrow || `Insight ${String(number).padStart(2, "0")}`}</p>
          <h3 className="mt-1 break-words text-base font-semibold leading-snug text-slate-100">{title}</h3>
          <p className="mt-1.5 break-words text-sm leading-6 text-slate-400">{explanation}</p>
          {children}
          <InlineActions actions={actions} onAction={onAction} pendingActionId={pendingActionId} blockId={blockId} />
        </div>
      </div>
    </article>
  );
}

export default memo(InsightCard);
