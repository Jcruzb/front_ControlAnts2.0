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


for (const [label, collection, identity] of [
  ["fijo", "recurringPayments", { id: 1 }],
  ["planificado antiguo", "plannedExpenses", { id: 2 }],
  ["planificado versionado", "plannedExpenses", { id: 3, source: "plan", plan_id: 3 }],
]) {
  test(`cerrar y reabrir agua de 50 € pagada por 30 € (${label})`, () => {
    const payment = { ...identity, planned_amount: "50.00", paid_amount: "30.00",
      is_completed: false, payment_status: "partially_paid" };
    const input = { incomePlans: [{ planned_amount: "100.00" }],
      plannedBudget: 50, plannedPaid: 30, actualSpent: 35, unplannedSpent: 5 };
    const open = buildMonthlyBudgetSummary({ ...input, [collection]: [payment],
      pendingPlannedExpenses: 20 });
    const closedPayment = { ...payment, is_completed: true, payment_status: "completed" };
    const closed = buildMonthlyBudgetSummary({ ...input, [collection]: [closedPayment],
      pendingPlannedExpenses: 0 });
    const reopened = buildMonthlyBudgetSummary({ ...input, [collection]: [payment],
      pendingPlannedExpenses: 20 });
    assert.equal(open.adjustedPlannedBudget, 50);
    assert.equal(open.projectedBalance, 45);
    assert.equal(closed.adjustedPlannedBudget, 30);
    assert.equal(closed.projectedBalance, 65);
    assert.equal(closed.plannedPaid, 30);
    assert.equal(closed.pendingPlannedExpenses, 0);
    assert.equal(closed.plannedBudget, 50);
    assert.equal(closed.balance, open.balance);
    assert.equal(closedPayment.planned_amount, "50.00");
    assert.deepEqual(reopened, open);
  });
}

test("ajusta solo pagos cerrados y admite cierre sin pagos o con exceso", () => {
  const summary = buildMonthlyBudgetSummary({
    incomePlans: [{ planned_amount: 300 }], plannedBudget: 200,
    plannedExpenses: [
      { planned_amount: 50, paid_amount: 0, is_completed: true },
      { planned_amount: 50, paid_amount: 70, payment_status: "completed" },
    ],
    recurringPayments: [
      { planned_amount: 50, paid_amount: 30, payment_status: "partially_paid" },
      { planned_amount: 50, paid_amount: 50, payment_status: "covered" },
    ],
    unplannedSpent: 10,
  });
  assert.equal(summary.adjustedPlannedBudget, 170);
  assert.equal(summary.projectedBalance, 120);
  assert.equal(summary.unplannedSpent, 10);
});

test("el ajuste usa importes canónicos, redondea y no se arrastra al siguiente mes", () => {
  const input = { incomePlans: [{ planned_amount: 1 }], plannedBudget: 0.3 };
  const closed = buildMonthlyBudgetSummary({ ...input, plannedExpenses: [
    { planned_amount: 0.1, paid_amount: 0, spent_amount: 99, is_completed: true },
    { planned_amount: 0.2, spent_amount: 0.1, is_completed: true },
  ] });
  assert.equal(closed.adjustedPlannedBudget, 0.1);
  assert.equal(closed.projectedBalance, 0.9);
  const nextMonth = buildMonthlyBudgetSummary({ ...input, plannedExpenses: [
    { planned_amount: 0.1, paid_amount: 0, is_completed: false },
    { planned_amount: 0.2, paid_amount: 0, is_completed: false },
  ] });
  assert.equal(nextMonth.adjustedPlannedBudget, 0.3);
  assert.equal(nextMonth.projectedBalance, 0.7);
});
