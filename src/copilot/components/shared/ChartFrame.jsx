import { BlockHeading, blockShell } from "./BlockPrimitives";
import { displayChartValue } from "../../utils/presentation";

import { CHART_COLORS } from "../../utils/chartTheme";

export function ChartFrame({ block, children }) {
  return (
    <section className={blockShell} aria-labelledby={`${block.id}-title`}>
      <div id={`${block.id}-title`}><BlockHeading title={block.title} description={block.explanation} /></div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Leyenda">
        {block.series.map((series, index) => (
          <span key={series.key} className="inline-flex items-center gap-2 text-xs text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index] }} aria-hidden="true" />{series.label}
          </span>
        ))}
      </div>
      <div className="mt-5 h-64 min-w-0 sm:h-72" aria-hidden="true">{children}</div>
      <div className="sr-only">
        <table>
          <caption>{block.title}: valores recibidos</caption>
          <thead><tr><th>{block.x_axis.label}</th>{block.series.map((series) => <th key={series.key}>{series.label}</th>)}</tr></thead>
          <tbody>{block.data.map((row, index) => <tr key={`${row[block.x_axis.key]}-${index}`}><th>{displayChartValue(row[block.x_axis.key])}</th>{block.series.map((series) => <td key={series.key}>{displayChartValue(row[series.key])}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Valores del gráfico">
        {block.data.map((row, index) => (
          <div key={`${row[block.x_axis.key]}-${index}`} className="min-w-0 rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs">
            <p className="truncate font-semibold text-slate-200">{displayChartValue(row[block.x_axis.key])}</p>
            <p className="mt-1 break-words text-slate-500">{block.series.map((series) => `${series.label}: ${displayChartValue(row[series.key])}`).join(" · ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
