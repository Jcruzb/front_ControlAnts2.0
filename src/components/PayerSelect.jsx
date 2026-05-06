import { getPayerDisplayName, getPayerSecondaryText } from "../utils/payers";

export default function PayerSelect({
  value = "",
  onChange,
  payers = [],
  disabled = false,
  required = false,
  label = "Quién paga",
  placeholder = "Selecciona quién paga",
}) {
  const normalizedValue =
    value !== null && value !== undefined ? String(value) : "";
  const hasCurrentOption =
    !normalizedValue || payers.some((payer) => String(payer.id) === normalizedValue);

  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-slate-200">{label}</span>
      <select
        value={normalizedValue}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {!hasCurrentOption ? (
          <option value={normalizedValue}>Pagador seleccionado</option>
        ) : null}
        {payers.map((payer) => {
          const label = getPayerDisplayName(payer);
          const secondary = getPayerSecondaryText(payer);

          return (
            <option key={payer.id} value={payer.id}>
              {secondary ? `${label} · ${secondary}` : label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
