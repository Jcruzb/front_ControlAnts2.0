const EMPTY_VALUES = new Set([null, undefined, ""]);

export function hasDisplayValue(value) {
  return !EMPTY_VALUES.has(value);
}

export function displayMetricValue(metric) {
  if (hasDisplayValue(metric?.formatted_value)) return String(metric.formatted_value);
  if (hasDisplayValue(metric?.value)) return String(metric.value);
  return "—";
}

export function displayTableValue(row, column) {
  const formattedKey = `formatted_${column.key}`;
  if (hasDisplayValue(row?.[formattedKey])) return String(row[formattedKey]);
  if (hasDisplayValue(row?.[column.key])) return String(row[column.key]);
  return "—";
}

export function displayChartValue(value) {
  return hasDisplayValue(value) ? String(value) : "—";
}
