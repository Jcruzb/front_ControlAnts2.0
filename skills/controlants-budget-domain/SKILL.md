---
name: controlants-budget-domain
description: Use this skill for ControlAnts tasks involving Budget, Dashboard, monthly metrics, planned incomes, planned expenses, recurring payments, variable expenses, payer summaries, category distribution, and budget formulas.
---

# ControlAnts Budget Domain Skill

## Source of Truth

- Month/year come from `BudgetMonthProvider`.
- `Budget.jsx` is the main product screen.
- Refresh affected data after mutations; avoid stale local totals.

Core endpoints:

- `GET /api/budget/?year=&month=`
- `GET /api/expenses/?year=&month=`
- `GET /api/incomes/?year=&month=`
- `GET /api/income-plans/month/?year=&month=`
- `POST /api/income-plans/:id/confirm/?year=&month=`
- `POST /api/income-plans/:id/adjust/?year=&month=`
- `GET /api/family/members/`

## Budget Metrics

Keep these concepts separate:

- **Ingresos del resumen**: registered incomes. Pending planned incomes are
  secondary projected context and are not part of the real balance.
- **Gastos planificados**: `total_planned`, including planned categories and recurring/fixed payments.
- **Gasto real**: `actual_spent` (or compatible `total_spent`), containing all
  real expenses registered in the selected month.
- **Pendiente planificado / Por pagar**: canonical `total_pending_amount` from
  the budget contract; do not reconstruct it from planned and paid totals.
- **Gastos no planificados**: expenses not linked to planned or recurring items.
- **Balance real**: registered income minus actual spending.
- **Balance proyectado**: when shown outside the primary summary, projected
  income minus planned budget and additional unplanned spending.
- **Excedente/faltante planificado**: `income - totalPlanned`, excluding unplanned expenses.

Do not subtract planned paid twice: paid planned expenses are already part of `total_planned`.

## Fixed vs Variable Expenses

Fixed if linked to a recurring payment:

- `recurring_payment`
- `recurring_payment_id`
- `recurring_payment_detail`
- `is_recurring === true`

Planned if linked to a planned expense:

- `planned_expense`
- `planned_expense_id`
- `planned_expense_detail`

Variable/unplanned only when neither fixed nor planned indicators exist.

Deduplicate expenses by `id` where possible before summing dashboard/budget totals.

## Planned Income Flow

When touching planned income adjust/confirm:

1. Use visible `year/month`, not system current month.
2. Send `year/month` to `confirm` and `adjust`.
3. After mutation, refresh budget, incomes, and income plan month data.
4. Navigating to another month must fetch fresh `/income-plans/month/`.
5. Keep copy clear: `Este ajuste se aplicará desde este mes en adelante.`

## Quick Payments

- `Pagar total` should allow optional payer selection.
- If no payer is selected, omit `payer`.
- For recurring items, send `recurring_payment`.
- For planned items, send `planned_expense`.
- Refresh `/budget/` and `/expenses/` after creating/deleting quick payments.

## Dashboard

- Distribution by category should use one deduplicated expenses array for the selected month.
- Resolve category name in this order: `category_detail.name`, `category_name`, `category.name`, category id via map, then `Sin categoría`.
- Payer summary groups by payer id/detail and uses `getPayerDisplayName`.
- Category accordion details must show only expenses from that category and month.

## Backend Boundary

If frontend cannot reliably identify type/category/payer, do not invent data. Report the exact endpoint, current payload, expected payload, and why frontend should not guess.

## Validation

Always run:

- `npm run lint`
- `npm run build`

For budget changes, manually check month navigation and no duplicate totals.
