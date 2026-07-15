import { memo } from "react";
import { BlockMessage, CopilotSkeleton } from "../shared/BlockPrimitives";
import { displayMetricValue } from "../../utils/presentation";

const STATUS_TONE = {
  positive: "border-emerald-400/16 bg-emerald-500/[0.07]",
  attention: "border-amber-400/16 bg-amber-500/[0.07]",
  negative: "border-red-400/16 bg-red-500/[0.07]",
  critical: "border-red-400/20 bg-red-500/10",
  neutral: "border-white/8 bg-white/[0.04]",
};

function MetricGrid({ block, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudieron cargar las métricas" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Métricas no disponibles" message="No tienes permisos para ver esta información." />;
  if (!Array.isArray(block?.items) || block.items.length === 0) return <BlockMessage title="Sin métricas" message="No hay valores para mostrar en este periodo." />;

  return (
    <section className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3" aria-label="Métricas principales">
      {block.items.map((item) => {
        const trend = item.trend;
        return (
          <article key={item.key} className={`min-w-0 rounded-[22px] border p-4 sm:p-5 ${STATUS_TONE[item.status] || STATUS_TONE.neutral}`}>
            <p className="break-words text-sm font-medium text-slate-400">{item.label}</p>
            <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">{displayMetricValue(item)}</p>
            {item.help_text ? <p className="mt-2 text-xs leading-5 text-slate-500">{item.help_text}</p> : null}
            {trend ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span aria-hidden="true">{trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}</span>
                <span className="font-semibold text-slate-200">{trend.formatted_value}</span>
                <span>{trend.comparison_label}</span>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

export default memo(MetricGrid);
