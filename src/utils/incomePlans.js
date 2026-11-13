// Only hide movements that are actually represented by a visible recurring card.
// Deactivated or historical plans can still have real income in this month.
export function getUnrepresentedIncomes(incomes, planItems) {
  const representedIds = new Set(planItems.map((item) => item.resolved_income?.id).filter((id) => id != null));
  return incomes.filter((income) => !representedIds.has(income.id));
}
