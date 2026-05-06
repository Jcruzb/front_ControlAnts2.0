export function getPayerDisplayName(payer) {
  const rawId = payer?.id ?? payer?.pk ?? "";
  const fallback = rawId ? `Pagador #${rawId}` : "Sin nombre";

  return (
    payer?.name ||
    payer?.full_name ||
    payer?.username ||
    payer?.email ||
    fallback
  );
}

export function getPayerSecondaryText(payer) {
  const displayName = getPayerDisplayName(payer);

  if (payer?.email && payer.email !== displayName) {
    return payer.email;
  }

  return "";
}
