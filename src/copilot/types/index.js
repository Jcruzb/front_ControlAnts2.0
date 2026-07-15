export const COPILOT_BLOCK_TYPES = Object.freeze({
  SUMMARY_CARD: "summary_card",
  METRIC_GRID: "metric_grid",
  ALERT: "alert",
  SIMPLE_TABLE: "simple_table",
  BAR_CHART: "bar_chart",
  LINE_CHART: "line_chart",
  RECOMMENDATION: "recommendation",
  QUESTION: "question",
  ACTION_GROUP: "action_group",
});

export const COPILOT_ACTION_TYPES = Object.freeze([
  "fetch_detail",
  "navigate",
  "send_intent",
  "submit_answer",
  "expand",
  "collapse",
]);

export const ALLOWED_NAVIGATION_TARGETS = new Set([
  "/",
  "/dashboard",
  "/expenses",
  "/incomes",
  "/recurring",
  "/categories",
  "/account",
]);
