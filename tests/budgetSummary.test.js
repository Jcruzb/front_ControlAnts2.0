import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthlyBudgetSummary } from "../src/utils/budgetSummary.js";

test("resume el mes con ingresos y gasto reales sin mezclar pendientes", () => {
  const summary = buildMonthlyBudgetSummary({
    registeredIncome: 5632,
    pendingPlannedIncome: 300,
    plannedBudget: 4023,
    actualSpent: 4027.11,
    pendingPlannedExpenses: 517.65,
    unplannedSpent: 495.38,
  });

  assert.equal(summary.registeredIncome, 5632);
  assert.equal(summary.projectedIncome, 5932);
  assert.equal(summary.balance, 1604.89);
  assert.equal(summary.budgetDifference, -4.11);
  assert.equal(summary.isOverBudget, true);
  assert.equal(summary.statusText, "Te has pasado este mes");
});

test("trata la cobertura exacta como presupuesto y pagos al día", () => {
  const summary = buildMonthlyBudgetSummary({
    registeredIncome: 1000,
    plannedBudget: 600,
    actualSpent: 600,
    pendingPlannedExpenses: 0,
  });

  assert.equal(summary.isOverBudget, false);
  assert.equal(summary.balance, 400);
  assert.equal(summary.budgetUsagePercentage, 100);
  assert.equal(summary.statusText, "Presupuesto y pagos al día");
});

test("marca como exceso el gasto real cuando no existe presupuesto", () => {
  const summary = buildMonthlyBudgetSummary({
    registeredIncome: 500,
    plannedBudget: 0,
    actualSpent: 25,
  });

  assert.equal(summary.isOverBudget, true);
  assert.equal(summary.budgetDifference, -25);
  assert.equal(summary.statusText, "Te has pasado este mes");
});
