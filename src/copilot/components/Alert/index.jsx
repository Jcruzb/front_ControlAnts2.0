import { memo } from "react";
import { BlockMessage, CopilotSkeleton } from "../shared/BlockPrimitives";
import InsightCard from "../InsightCard";

function Alert({ block, onAction, pendingActionId, position = 1, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton compact />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar la alerta" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Alerta no disponible" message="No tienes permisos para verla." />;
  if (!block?.title || !block?.message) return <BlockMessage title="Sin alertas" message="No hay avisos para mostrar." />;
  const actions = block.actions || (block.action ? [block.action] : []);

  return (
    <InsightCard number={position} title={block.title} explanation={block.message} tone={block.severity} actions={actions} onAction={onAction} pendingActionId={pendingActionId} blockId={block.id} role={block.severity === "critical" || block.severity === "error" ? "alert" : "status"}>
      {block.facts && Object.keys(block.facts).length ? <dl className="mt-3 flex flex-wrap gap-2">{Object.entries(block.facts).map(([key, value]) => <div key={key} className="rounded-xl bg-black/15 px-2.5 py-1.5 text-[11px]"><dt className="inline text-slate-600">{key}:</dt><dd className="ml-1 inline font-medium text-slate-300">{String(value)}</dd></div>)}</dl> : null}
    </InsightCard>
  );
}

export default memo(Alert);
