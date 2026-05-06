export function normalizeDecimalInput(value) {
  return String(value ?? "").trim().replace(",", ".");
}

export function parseAmount(value) {
  const normalized = normalizeDecimalInput(value);

  if (!normalized) {
    return Number.NaN;
  }

  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return Number.NaN;
  }

  return Number(normalized);
}

export function formatAmountForApi(value) {
  const amount = parseAmount(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "";
}
