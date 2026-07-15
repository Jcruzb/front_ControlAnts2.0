import { memo } from "react";
import { BlockMessage, CopilotSkeleton, InlineActions, blockShell } from "../shared/BlockPrimitives";

function ActionGroup({ block, onAction, pendingActionId, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton compact />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudieron cargar las acciones" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Acciones no disponibles" message="No tienes permisos para ejecutarlas." />;
  if (!Array.isArray(block?.actions) || block.actions.length === 0) return <BlockMessage title="Sin acciones" message="No hay pasos adicionales disponibles." />;
  const layout = block.layout === "stacked" ? "[&>div]:flex-col [&_button]:w-full" : "";
  return <section className={`${blockShell} ${layout}`} aria-label="Siguientes pasos"><InlineActions actions={block.actions} onAction={onAction} pendingActionId={pendingActionId} blockId={block.id} /></section>;
}

export default memo(ActionGroup);
