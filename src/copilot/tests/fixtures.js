export const action = { id: "detail", type: "fetch_detail", label: "Ver detalle", intent: "monthly_summary_detail", arguments: { year: 2026, month: 7 }, style: "primary" };

export const blocks = {
  summary_card: { type: "summary_card", id: "summary", title: "Julio de 2026", headline: "Vais dentro del presupuesto", description: "Resumen recibido.", status: "positive" },
  metric_grid: { type: "metric_grid", id: "metrics", items: [{ key: "income", label: "Ingresos", value: "1000.00", formatted_value: "1.000,00 €", status: "positive" }, { key: "spent", label: "Gastado", value: "420.00", formatted_value: "420,00 €", status: "neutral" }] },
  alert: { type: "alert", id: "alert", code: "pending", severity: "warning", title: "Pago pendiente", message: "Queda un pago registrado como pendiente.", facts: { amount: "80.00" }, action },
  simple_table: { type: "simple_table", id: "table", title: "Movimientos", description: "Datos recibidos.", columns: [{ key: "name", label: "Gasto", format: "text", align: "left" }, { key: "amount", label: "Importe", format: "currency", align: "right" }], rows: [{ id: "row_1", name: "Compra", amount: "20.00", formatted_amount: "20,00 €" }], limit: 10, total_rows: 1, has_more: false },
  bar_chart: { type: "bar_chart", id: "bars", title: "Por categoría", explanation: "Valores registrados.", x_axis: { key: "category", label: "Categoría" }, series: [{ key: "amount", label: "Gastado", format: "currency" }], data: [{ category: "Hogar", amount: "20.00" }] },
  line_chart: { type: "line_chart", id: "lines", title: "Evolución", explanation: "Valores registrados.", x_axis: { key: "period", label: "Mes" }, series: [{ key: "amount", label: "Gastado", format: "currency", data_kind: "actual" }], data: [{ period: "Junio de 2026", amount: "10.00" }, { period: "Julio de 2026", amount: "20.00" }] },
  recommendation: { type: "recommendation", id: "recommendation", level: "recommended", headline: "Mantén el ritmo", explanation: "El consejo recibido del backend.", reasons: [{ code: "stable", text: "El gasto se mantiene estable." }], confidence: "high" },
  question: { type: "question", id: "question", question: "¿Por qué ocurrió?", reason: "Ayuda a contextualizar el dato.", input: { type: "single_choice", key: "reason", required: true, options: ["Vacaciones", "Compra puntual"] } },
  action_group: { type: "action_group", id: "actions", layout: "inline", actions: [action, { id: "budget", type: "navigate", label: "Abrir presupuesto", target: "/", style: "secondary" }] },
};
