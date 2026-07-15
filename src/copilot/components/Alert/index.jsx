import { memo } from "react";
import { BlockMessage, CopilotSkeleton, InlineActions } from "../shared/BlockPrimitives";

const SEVERITY = {
  success: { icon: "✓", classes: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" },
  info: { icon: "i", classes: "border-blue-400/20 bg-blue-500/10 text-blue-100" },
  warning: { icon: "!", classes: "border-amber-400/20 bg-amber-500/10 text-amber-100" },
  error: { icon: "!", classes: "border-red-400/20 bg-red-500/10 text-red-100" },
  critical: { icon: "!", classes: "border-red-400/20 bg-red-500/10 text-red-100" },
};

function Alert({ block, onAction, pendingActionId, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton compact />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar la alerta" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Alerta no disponible" message="No tienes permisos para verla." />;
  if (!block?.title || !block?.message) return <BlockMessage title="Sin alertas" message="No hay avisos para mostrar." />;
  const visual = SEVERITY[block.severity] || SEVERITY.info;
  const actions = block.actions || (block.action ? [block.action] : []);

  return (
    <section className={`min-w-0 rounded-[22px] border p-4 sm:p-5 ${visual.classes}`} role={block.severity === "critical" || block.severity === "error" ? "alert" : "status"}>
      <div className="flex min-w-0 gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/20 bg-black/10 text-sm font-bold" aria-hidden="true">{block.icon || visual.icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="break-words font-semibold text-current">{block.title}</h2>
          <p className="mt-1 break-words text-sm leading-6 opacity-80">{block.message}</p>
          {block.facts && Object.keys(block.facts).length ? (
            <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(block.facts).map(([key, value]) => (
                <div key={key} className="min-w-0 rounded-xl bg-black/10 px-3 py-2 text-xs">
                  <dt className="break-words opacity-60">{key}</dt><dd className="mt-1 break-words font-semibold">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <InlineActions actions={actions} onAction={onAction} pendingActionId={pendingActionId} blockId={block.id} />
        </div>
      </div>
    </section>
  );
}

export default memo(Alert);
