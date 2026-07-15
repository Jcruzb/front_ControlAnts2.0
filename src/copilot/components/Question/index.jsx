import { memo } from "react";
import { BlockMessage, CopilotSkeleton, blockShell } from "../shared/BlockPrimitives";

function Question({ block, onAnswer, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar la pregunta" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Pregunta no disponible" message="No tienes permisos para responder." />;
  if (!block?.question) return <BlockMessage title="Sin preguntas" message="El Copiloto no necesita más información." />;
  const options = Array.isArray(block.input?.options) ? block.input.options : [];
  return (
    <section className={`${blockShell} border-cyan-400/15 bg-cyan-500/[0.055]`} aria-labelledby={`${block.id}-title`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Pregunta del Copiloto</p>
      <h2 id={`${block.id}-title`} className="mt-2 text-xl font-semibold text-white">{block.question}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{block.reason}</p>
      {options.length ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2" role="group" aria-label={block.question}>
          {options.map((option) => <button key={option} type="button" onClick={() => onAnswer?.({ key: block.input.key, value: option, blockId: block.id })} className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><span className="h-3 w-3 shrink-0 rounded-full border border-cyan-200/70" aria-hidden="true" />{option}</button>)}
        </div>
      ) : <p className="mt-4 text-sm text-slate-500">No hay respuestas rápidas disponibles.</p>}
    </section>
  );
}

export default memo(Question);
