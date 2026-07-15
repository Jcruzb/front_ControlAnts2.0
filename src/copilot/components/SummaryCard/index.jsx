import { memo } from "react";
import { BlockHeading, BlockMessage, CopilotSkeleton, InlineActions, blockShell } from "../shared/BlockPrimitives";

const STATUS = {
  neutral: { icon: "◎", tone: "from-blue-500/18 to-cyan-400/5", badge: "text-blue-200 bg-blue-500/12" },
  positive: { icon: "✓", tone: "from-emerald-500/18 to-emerald-400/5", badge: "text-emerald-200 bg-emerald-500/12" },
  attention: { icon: "!", tone: "from-amber-500/18 to-amber-400/5", badge: "text-amber-100 bg-amber-500/12" },
  negative: { icon: "↓", tone: "from-red-500/18 to-red-400/5", badge: "text-red-200 bg-red-500/12" },
  critical: { icon: "!", tone: "from-red-600/22 to-rose-500/7", badge: "text-red-100 bg-red-500/15" },
};

function SummaryCard({ block, onAction, pendingActionId, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar el resumen" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Resumen no disponible" message="No tienes permisos para ver esta información." />;
  if (!block?.title || !block?.headline) return <BlockMessage title="Resumen no disponible" message="El backend no devolvió contenido para este bloque." />;

  const visual = STATUS[block.status] || STATUS.neutral;
  const actions = block.actions || (block.action ? [block.action] : []);
  return (
    <section className={`${blockShell} overflow-hidden bg-gradient-to-br ${visual.tone}`} aria-labelledby={`${block.id}-title`}>
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-xl text-white" aria-hidden="true">
          {block.icon || visual.icon}
        </div>
        <div className="min-w-0 flex-1">
          <BlockHeading title={block.title} eyebrow={block.subtitle} />
          <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${visual.badge}`}>{block.status}</span>
        </div>
      </div>
      <h1 id={`${block.id}-title`} className="mt-7 max-w-4xl break-words text-2xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-3xl">
        {block.headline}
      </h1>
      {block.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{block.description}</p> : null}
      <InlineActions actions={actions} onAction={onAction} pendingActionId={pendingActionId} blockId={block.id} />
    </section>
  );
}

export default memo(SummaryCard);
