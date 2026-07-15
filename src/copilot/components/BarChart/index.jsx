import { memo } from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BlockMessage, CopilotSkeleton } from "../shared/BlockPrimitives";
import { ChartFrame } from "../shared/ChartFrame";
import { CHART_COLORS } from "../../utils/chartTheme";

function BarChart({ block, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar la gráfica" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Gráfica no disponible" message="No tienes permisos para ver estos datos." />;
  if (!Array.isArray(block?.data) || block.data.length === 0 || !Array.isArray(block.series) || block.series.length === 0) return <BlockMessage title={block?.title || "Sin datos"} message="No hay valores para representar." />;

  return (
    <ChartFrame block={block}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={block.data} margin={{ top: 8, right: 4, left: -20, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey={block.x_axis.key} tick={{ fill: "#8b96ab", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8b96ab", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#111823", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14 }} />
          {block.series.map((series, index) => <Bar key={series.key} dataKey={series.key} name={series.label} fill={CHART_COLORS[index]} radius={[6, 6, 0, 0]} />)}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default memo(BarChart);
