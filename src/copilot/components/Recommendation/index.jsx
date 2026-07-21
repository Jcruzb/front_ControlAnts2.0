import { memo } from "react";
import { BlockMessage, CopilotSkeleton } from "../shared/BlockPrimitives";
import InsightCard from "../InsightCard";

function Recommendation({ block, onAction, pendingActionId, position = 1, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar el consejo" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Consejo no disponible" message="No tienes permisos para verlo." />;
  if (!block?.headline || !block?.explanation) return <BlockMessage title="Sin recomendaciones" message="No hay consejos para mostrar." />;
  return <InsightCard number={position} eyebrow={`${block.level} · ${block.confidence}`} title={block.headline} explanation={block.explanation} tone="recommendation" actions={block.actions} onAction={onAction} pendingActionId={pendingActionId} blockId={block.id}>
    {Array.isArray(block.reasons) && block.reasons.length ? <ul className="mt-3 grid gap-1.5 text-xs leading-5 text-slate-500">{block.reasons.map((reason) => <li key={reason.code} className="flex gap-2"><span aria-hidden="true">•</span><span>{reason.text}</span></li>)}</ul> : null}
  </InsightCard>;
}

export default memo(Recommendation);
