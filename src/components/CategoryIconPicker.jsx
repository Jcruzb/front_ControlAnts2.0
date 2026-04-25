const SUGGESTED_ICONS = [
  "🏠",
  "🛒",
  "🍽️",
  "🚗",
  "💡",
  "📚",
  "🎉",
  "🏥",
  "💼",
  "💰",
  "📦",
  "🔁",
  "🧾",
  "💳",
  "🏦",
  "🎁",
  "✈️",
  "🎬",
];

export default function CategoryIconPicker({
  value = "",
  onChange,
  disabled = false,
}) {
  const selectedIcon = value || "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-slate-200">
          Icono
        </label>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
          <span>Vista previa:</span>
          <span className="text-base leading-none">{selectedIcon || "🙂"}</span>
        </div>
      </div>

      <input
        type="text"
        inputMode="text"
        placeholder="Ej: 🍎"
        value={selectedIcon}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
        {SUGGESTED_ICONS.map((icon) => {
          const active = selectedIcon === icon;

          return (
            <button
              key={icon}
              type="button"
              onClick={() => onChange?.(icon)}
              disabled={disabled}
              aria-pressed={active}
              className={`flex aspect-square items-center justify-center rounded-2xl border text-xl transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-blue-400/30 bg-blue-500/12"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
