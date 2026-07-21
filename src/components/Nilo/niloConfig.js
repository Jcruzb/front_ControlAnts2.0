export const NILO_STATES = Object.freeze([
  "greeting",
  "satisfied",
  "thinking",
  "analyzing",
  "waiting",
  "surprised",
  "concerned",
  "alert",
  "celebrating",
  "idle",
]);

const STATE_ALIASES = Object.freeze({
  loading: "thinking",
  good_news: "celebrating",
  "good-news": "celebrating",
  warning: "concerned",
  concern: "concerned",
  attention: "alert",
  celebration: "celebrating",
});

const SIZE_VALUES = Object.freeze({
  xs: "32px",
  sm: "64px",
  md: "128px",
  lg: "256px",
  xl: "512px",
  floating: "64px",
  compact: "128px",
  hero: "clamp(18rem, 38vw, 24rem)",
});

export function normalizeNiloState(value) {
  const candidate = STATE_ALIASES[value] || value;
  return NILO_STATES.includes(candidate) ? candidate : "idle";
}

export function resolveNiloSize(value) {
  if (typeof value === "number") return `${Math.max(24, value)}px`;
  return SIZE_VALUES[value] || value || SIZE_VALUES.md;
}
