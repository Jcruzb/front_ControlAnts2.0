import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../src/", import.meta.url);

async function source(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

test("los pagos de planes nuevos envían el vínculo explícito al backend", async () => {
  const budget = await source("pages/Budget.jsx");

  assert.match(budget, /planned_expense_plan:\s*plannedExpensePlanId/);
  assert.match(budget, /item\.source === "plan" \? item\.plan_id/);
});

test("la interfaz oculta mutaciones de configuración a miembros", async () => {
  const [categories, recurring, navbar, incomePlans] = await Promise.all([
    source("pages/Categories.jsx"),
    source("pages/RecurringPayments.jsx"),
    source("components/Navbar.jsx"),
    source("components/IncomePlanMonthItem.jsx"),
  ]);

  assert.match(categories, /profile\?\.role === "admin"/);
  assert.match(recurring, /profile\?\.role === "admin"/);
  assert.match(navbar, /role === "admin"/);
  assert.match(incomePlans, /canManage/);
});

test("los errores globales explican límites y falta de permisos", async () => {
  const api = await source("services/api.js");

  assert.match(api, /status === 429/);
  assert.match(api, /status === 403/);
});
