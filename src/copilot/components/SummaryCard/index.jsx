import { memo } from "react";
import { BlockMessage, CopilotSkeleton } from "../shared/BlockPrimitives";
import InsightCard from "../InsightCard";

const STATUS_TONES = { neutral: "info", positive: "success", attention: "warning", negative: "critical", critical: "critical" };

function SummaryCard({ block, onAction, pendingActionId, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar el resumen" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Resumen no disponible" message="No tienes permisos para ver esta información." />;
  if (!block?.title || !block?.headline) return <BlockMessage title="Resumen no disponible" message="El backend no devolvió contenido para este bloque." />;

  const actions = block.actions || (block.action ? [block.action] : []);
  return <InsightCard number={1} eyebrow={`${block.title} · ${block.status}`} title={block.headline} explanation={block.description || block.title} tone={STATUS_TONES[block.status] || "info"} actions={actions} onAction={onAction} pendingActionId={pendingActionId} blockId={block.id} />;
}

export default memo(SummaryCard);
