function toAmount(value) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function toCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildMonthlyBudgetSummary({
  registeredIncome,
  pendingPlannedIncome,
  incomePlans = [],
  plannedPaid,
  plannedBudget,
  actualSpent,
  pendingPlannedExpenses,
  unplannedSpent,
}) {
  const income = toAmount(registeredIncome);
  const pendingIncome = toAmount(pendingPlannedIncome);
  // Sum every monthly plan, including resolved plans: collecting does not change the forecast.
  const plannedIncome = toCurrency(incomePlans.reduce(
    (sum, item) => sum + toAmount(item.planned_amount), 0
  ));
  const budget = toAmount(plannedBudget);
  const spent = toAmount(actualSpent);
  const pendingExpenses = toAmount(pendingPlannedExpenses);
  const unplanned = toAmount(unplannedSpent);
  const budgetDifference = budget - spent;
  const isOverBudget = spent > budget;
  const paymentsAreCurrent = budget > 0 && pendingExpenses <= 0;

  return {
    plannedIncome,
    projectedBalance: toCurrency(plannedIncome - budget - unplanned),
    plannedPaid: toAmount(plannedPaid ?? Math.max(spent - unplanned, 0)),
    registeredIncome: income,
    pendingPlannedIncome: pendingIncome,
    projectedIncome: toCurrency(income + pendingIncome),
    plannedBudget: budget,
    actualSpent: spent,
    pendingPlannedExpenses: pendingExpenses,
    unplannedSpent: unplanned,
    balance: toCurrency(income - spent),
    budgetDifference: toCurrency(budgetDifference),
    budgetUsagePercentage:
      budget > 0 ? Math.min(Math.max((spent / budget) * 100, 0), 100) : 0,
    isOverBudget,
    statusText: isOverBudget
      ? "Te has pasado este mes"
      : paymentsAreCurrent
      ? "Presupuesto y pagos al día"
      : "Vas dentro del presupuesto",
  };
}
