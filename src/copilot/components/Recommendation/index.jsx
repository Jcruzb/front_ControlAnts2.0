import { memo } from "react";
import { BlockMessage, CopilotSkeleton, blockShell } from "../shared/BlockPrimitives";

function Recommendation({ block, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar el consejo" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Consejo no disponible" message="No tienes permisos para verlo." />;
  if (!block?.headline || !block?.explanation) return <BlockMessage title="Sin recomendaciones" message="No hay consejos para mostrar." />;
  return (
    <section className={`${blockShell} border-violet-400/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.14),rgba(37,99,235,0.05))]`} aria-labelledby={`${block.id}-title`}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-xl" aria-hidden="true">{block.level === "not_affordable" ? "🎯" : "💡"}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">Recomendación · {block.confidence}</p>
          <h2 id={`${block.id}-title`} className="mt-2 break-words text-xl font-semibold text-white">{block.headline}</h2>
          <p className="mt-2 break-words text-sm leading-6 text-slate-300">{block.explanation}</p>
          {Array.isArray(block.reasons) && block.reasons.length ? <ul className="mt-4 grid gap-2 text-sm text-slate-300">{block.reasons.map((reason) => <li key={reason.code} className="flex gap-2"><span aria-hidden="true">•</span><span>{reason.text}</span></li>)}</ul> : null}
        </div>
      </div>
    </section>
  );
}

export default memo(Recommendation);
