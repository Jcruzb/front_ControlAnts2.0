import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  formatDifference,
  getPaidAmount,
  getPaymentStatus,
  getPendingAmount,
  isExpenseMonthCompleted,
  isMonthCompleted,
  isRecurringExpenseMonthCompleted,
  mergeMonthStatus,
  PAYMENT_STATUS_LABELS,
} from "../src/utils/recurringMonthStatus.js";

test("expone los cinco estados mensuales con texto visible", () => {
  assert.deepEqual(PAYMENT_STATUS_LABELS, {
    pending: "Pendiente",
    partially_paid: "Parcialmente pagado",
    covered: "Pagado",
    exceeded: "Presupuesto superado",
    completed: "Completado",
  });
});

test("prioriza importes canónicos y conserva fallbacks compatibles", () => {
  const item = { paid_amount: 37, spent_amount: 99, pending_amount: 0, remaining_amount: 3 };
  assert.equal(getPaidAmount(item), 37);
  assert.equal(getPendingAmount(item), 0);
  assert.equal(getPaidAmount({ spent_amount: 12 }), 12);
  assert.equal(getPendingAmount({ remaining_amount: 8 }), 8);
});

test("completar conserva la diferencia aunque el pendiente sea cero", () => {
  const item = { payment_status: "completed", is_completed: true, pending_amount: 0, difference_amount: 3 };
  assert.equal(getPaymentStatus(item), "completed");
  assert.equal(isMonthCompleted(item), true);
  assert.equal(getPendingAmount(item), 0);
  assert.equal(formatDifference(item.difference_amount), "3.00 € menos de lo planificado");
});

test("reapertura consume el pendiente devuelto por backend", () => {
  const reopened = { payment_status: "partially_paid", is_completed: false, pending_amount: 3 };
  assert.equal(isMonthCompleted(reopened), false);
  assert.equal(getPendingAmount(reopened), 3);
});

test("actualizar el estado conserva la identidad del pago planificado", () => {
  const plan = { id: 12, source: "plan", plan_id: 12, pending_amount: 41 };
  const closed = mergeMonthStatus(plan, {
    id: 87,
    planned_expense_plan: 12,
    is_completed: true,
    pending_amount: 0,
  });

  assert.equal(closed.id, 12);
  assert.equal(closed.plan_id, 12);
  assert.equal(closed.source, "plan");
  assert.equal(closed.occurrence_id, 87);
  assert.equal(closed.pending_amount, 0);
});

test("diferencia negativa nunca se oculta", () => {
  assert.equal(formatDifference(-5), "5.00 € por encima de lo planificado");
  assert.equal(formatDifference(0), "Coincide con lo planificado");
});

test("solo bloquea gastos con estado mensual recurrente completado", () => {
  assert.equal(isRecurringExpenseMonthCompleted({ recurring_payment_month: { is_completed: true } }), true);
  assert.equal(isRecurringExpenseMonthCompleted({ recurring_payment_month: null }), false);
  assert.equal(isRecurringExpenseMonthCompleted({ is_recurring: false }), false);
});

test("reconoce el cierre mensual de gastos planificados y recurrentes", () => {
  assert.equal(
    isExpenseMonthCompleted({ planned_payment_month: { is_completed: true } }),
    true
  );
  assert.equal(
    isExpenseMonthCompleted({ recurring_payment_month: { payment_status: "completed" } }),
    true
  );
  assert.equal(isExpenseMonthCompleted({}), false);
});

test("las vistas afectadas no reconstruyen pendiente como planificado menos pagado", async () => {
  const [budget, dashboard] = await Promise.all([
    readFile(new URL("../src/pages/Budget.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Dashboard.jsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(budget, /Math\.max\s*\(\s*totalPlannedAmount\s*-\s*plannedPaidAmount/);
  assert.doesNotMatch(dashboard, /Math\.max\s*\(\s*monthlyAmount\s*-\s*paidThisMonth/);
  assert.match(budget, /total_pending_amount/);
  assert.match(dashboard, /pending_amount/);
});

test("el servicio mensual envía year, month e is_completed al endpoint dedicado", async () => {
  const service = await readFile(
    new URL("../src/services/recurringPaymentsService.js", import.meta.url),
    "utf8"
  );
  assert.match(service, /month-status\//);
  assert.match(service, /params:\s*\{ year, month \}/);
  assert.match(service, /is_completed:\s*isCompleted/);
});

test("el cierre mensual vive exclusivamente dentro del detalle compartido", async () => {
  const [budgetItem, detailSheet] = await Promise.all([
    readFile(new URL("../src/components/BudgetItem.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ExpenseDetailSheet.jsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(budgetItem, /Cerrar pago del mes/);
  assert.match(detailSheet, /Cerrar pago del mes/);
  assert.match(detailSheet, /aunque no haya pagos/);
});

test("los dos sistemas planificados actualizan el estado mensual dedicado", async () => {
  const service = await readFile(
    new URL("../src/services/plannedExpenses.js", import.meta.url),
    "utf8"
  );

  assert.match(service, /planned-expense-plans\/\$\{id\}\/month-status\//);
  assert.match(service, /planned-expenses\/\$\{id\}\/month-status\//);
  assert.match(service, /is_completed:\s*isCompleted/);
});
