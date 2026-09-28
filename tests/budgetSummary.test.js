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

test("cobrar un plan no incrementa ingresos previstos ni balance previsto", () => {
  const budget = { plannedBudget: 3807.45, unplannedSpent: 120 };
  const before = buildMonthlyBudgetSummary({ ...budget,
    incomePlans: [{ planned_amount: "4200.00", status: "PENDING" }],
    registeredIncome: 0, pendingPlannedIncome: 4200,
  });
  const after = buildMonthlyBudgetSummary({ ...budget,
    incomePlans: [{ planned_amount: "4200.00", status: "RESOLVED",
      resolved_income: { amount: "3912.81" } }],
    registeredIncome: 3912.81, pendingPlannedIncome: 0,
  });
  assert.equal(before.plannedIncome, 4200);
  assert.equal(after.plannedIncome, before.plannedIncome);
  assert.equal(after.projectedBalance, 272.55);
  assert.equal(after.projectedBalance, before.projectedBalance);
  assert.equal(after.registeredIncome, 3912.81);
  assert.equal(after.pendingPlannedIncome, 0);
});

test("pagar presupuesto mueve pagado y pendiente sin descontarlo dos veces", () => {
  const input = { incomePlans: [{ planned_amount: 1000 }], plannedBudget: 600,
    unplannedSpent: 50 };
  const before = buildMonthlyBudgetSummary({ ...input,
    actualSpent: 50, plannedPaid: 0, pendingPlannedExpenses: 600 });
  const after = buildMonthlyBudgetSummary({ ...input,
    actualSpent: 250, plannedPaid: 200, pendingPlannedExpenses: 400 });
  assert.equal(after.plannedBudget, before.plannedBudget);
  assert.equal(after.projectedBalance, 350);
  assert.equal(after.projectedBalance, before.projectedBalance);
  assert.equal(after.plannedPaid, 200);
  assert.equal(after.pendingPlannedExpenses, 400);
  assert.equal(after.unplannedSpent, 50);
});

test("respeta pendiente canónico al cerrar un gasto y conserva sobrepagos", () => {
  const closed = buildMonthlyBudgetSummary({ plannedBudget: 600,
    plannedPaid: 200, pendingPlannedExpenses: 0 });
  assert.equal(closed.pendingPlannedExpenses, 0);
  assert.equal(closed.plannedPaid, 200);
  const overpaid = buildMonthlyBudgetSummary({ plannedBudget: 600,
    actualSpent: 750, unplannedSpent: 50, plannedPaid: 700,
    pendingPlannedExpenses: 0 });
  assert.equal(overpaid.plannedBudget, 600);
  assert.equal(overpaid.plannedPaid, 700);
  assert.equal(overpaid.unplannedSpent, 50);
});

test("mes vacío, planes sin versión, decimales y balance negativo", () => {
  const empty = buildMonthlyBudgetSummary({});
  assert.equal(empty.plannedIncome, 0);
  assert.equal(empty.projectedBalance, 0);
  assert.equal(empty.unplannedSpent, 0);
  const nextMonth = buildMonthlyBudgetSummary({
    incomePlans: [{ planned_amount: null }, { planned_amount: "0.10" }, { planned_amount: "0.20" }],
    plannedBudget: 0.2, unplannedSpent: 0.25,
  });
  assert.equal(nextMonth.plannedIncome, 0.3);
  assert.equal(nextMonth.projectedBalance, -0.15);
});
