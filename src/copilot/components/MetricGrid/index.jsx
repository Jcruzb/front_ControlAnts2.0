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
    <section className="min-w-0 overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.025]" aria-label="Métricas de apoyo">
      {block.items.map((item) => {
        const trend = item.trend;
        return (
          <article key={item.key} className={`flex min-w-0 items-start justify-between gap-4 border-b border-white/6 p-4 last:border-b-0 sm:p-5 ${STATUS_TONE[item.status] || STATUS_TONE.neutral}`}>
            <div className="min-w-0"><p className="break-words text-sm font-medium text-slate-300">{item.label}</p>
            {item.help_text ? <p className="mt-1 text-xs leading-5 text-slate-500">{item.help_text}</p> : null}</div>
            <div className="shrink-0 text-right"><p className="break-words text-lg font-semibold tracking-tight text-white sm:text-xl">{displayMetricValue(item)}</p>
            {trend ? (
              <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5 text-[11px] text-slate-500">
                <span aria-hidden="true">{trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}</span>
                <span className="font-semibold text-slate-200">{trend.formatted_value}</span>
                <span>{trend.comparison_label}</span>
              </div>
            ) : null}</div>
          </article>
        );
      })}
    </section>
  );
}

export default memo(MetricGrid);
