import { memo } from "react";
import BlockErrorBoundary from "../components/shared/BlockErrorBoundary";
import { BlockMessage, CopilotSkeleton } from "../components/shared/BlockPrimitives";
import blockRegistry from "./registry";
import UnknownBlock from "./UnknownBlock";
import VisibleBlock from "./VisibleBlock";

function CopilotRenderer({ response, onAction, onAnswer, pendingActionId, loading = false, error = null, permissionDenied = false }) {
  if (loading) return <div className="grid gap-4"><CopilotSkeleton /><CopilotSkeleton /><CopilotSkeleton compact /></div>;
  if (permissionDenied) return <BlockMessage kind="permission" title="Copiloto no disponible" message="No tienes permisos para consultar esta información." />;
  if (error) return <BlockMessage kind="error" title="No se pudo cargar el Copiloto" message={error} />;
  if (!Array.isArray(response?.blocks) || response.blocks.length === 0) return <BlockMessage title="Sin información para mostrar" message="El backend no devolvió bloques para este periodo." />;

  return (
    <div className="grid min-w-0 max-w-full gap-4 sm:gap-5">
      {response.blocks.map((block, index) => {
        const Component = blockRegistry[block?.type] || UnknownBlock;
        return (
          <VisibleBlock key={block?.id || `${block?.type || "block"}-${index}`}>
            <BlockErrorBoundary>
              <Component block={block} type={block?.type} onAction={onAction} onAnswer={onAnswer} pendingActionId={pendingActionId} />
            </BlockErrorBoundary>
          </VisibleBlock>
        );
      })}
    </div>
  );
}

export default memo(CopilotRenderer);
