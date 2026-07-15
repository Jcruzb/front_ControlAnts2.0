import { memo } from "react";
import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BlockMessage, CopilotSkeleton } from "../shared/BlockPrimitives";
import { ChartFrame } from "../shared/ChartFrame";
import { CHART_COLORS } from "../../utils/chartTheme";

function LineChart({ block, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar la evolución" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Evolución no disponible" message="No tienes permisos para ver estos datos." />;
  if (!Array.isArray(block?.data) || block.data.length === 0 || !Array.isArray(block.series) || block.series.length === 0) return <BlockMessage title={block?.title || "Sin datos"} message="No hay valores para representar." />;

  return (
    <ChartFrame block={block}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={block.data} margin={{ top: 8, right: 4, left: -20, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey={block.x_axis.key} tick={{ fill: "#8b96ab", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8b96ab", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#111823", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14 }} />
          {block.series.map((series, index) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={CHART_COLORS[index]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default memo(LineChart);
