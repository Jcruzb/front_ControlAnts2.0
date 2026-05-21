# ControlAnts 2.0 Frontend

Guía breve para continuar el desarrollo del frontend. Mantener este archivo corto; el detalle específico vive en `skills/`.

## Proyecto

- App React + Vite + Tailwind para presupuesto familiar, gastos, ingresos, pagos fijos, categorías, dashboard e importación/exportación Excel.
- Backend Django/DRF bajo `/api/`.
- Autenticación con cookies de sesión + CSRF, sin tokens manuales.

## Stack

- React 19
- React Router 7
- Vite
- Tailwind CSS 4
- Axios centralizado
- `xlsx`

## Estructura

- `src/app`: layout y rutas.
- `src/context`: autenticación y mes/año activo.
- `src/hooks`: hooks compartidos.
- `src/services`: API y contratos backend.
- `src/pages`: vistas principales.
- `src/components`: UI, cards, formularios y modales.
- `src/utils`: helpers de dominio.

## Rutas principales

- `/`: `Budget`
- `/dashboard`: `Dashboard`
- `/expenses`: `ExpensesList`
- `/expenses/new`: `AddExpense`
- `/incomes`: `IncomesList`
- `/recurring`: `RecurringPayments`
- `/categories`: `Categories`
- `/account`: `Account`
- `/login`: `Login`
- `/register`: `Register`

## Reglas base

- Mantener `Budget` como pantalla principal.
- Usar `BudgetMonthProvider` como fuente de verdad para `year/month`.
- Usar `src/services/api.js`, `unwrapCollectionResponse` y `getApiErrorMessage`.
- No cambiar endpoints ni contratos sin indicarlo claramente.
- No tocar autenticación salvo que la tarea lo pida.
- Tras mutaciones, refrescar el bloque afectado y evitar estado obsoleto.
- Mantener pagador (`payer`) opcional.
- No asumir una forma única de categoría: puede venir como `category`, `category_name` o `category_detail`.
- Validación mínima antes de cerrar cambios: `npm run lint` y `npm run build`.

## Skills del proyecto

Carga solo la skill que aplique a la tarea:

- `skills/controlants-design/SKILL.md`: diseño, UX, responsive, colores, overflow, branding y componentes visuales.
- `skills/controlants-frontend-patterns/SKILL.md`: patrones React, formularios, modales, API, errores, importes, pagadores y categorías.
- `skills/controlants-budget-domain/SKILL.md`: presupuesto, dashboard, ingresos planificados, pagos fijos/variables y fórmulas sensibles.

## Contratos sensibles

- `GET /api/budget/?year=&month=`
- `GET/POST/PATCH/DELETE /api/expenses/`
- `GET/POST/PATCH/DELETE /api/incomes/`
- `GET/POST/PATCH/DELETE /api/categories/`
- `GET/POST/PUT/PATCH/DELETE /api/recurring-payments/`
- `GET /api/family/members/`
- `GET /api/income-plans/month/?year=&month=`
- `POST /api/income-plans/:id/confirm/?year=&month=`
- `POST /api/income-plans/:id/adjust/?year=&month=`

## Deuda conocida

- `Budget.jsx` concentra demasiada responsabilidad.
- Normalización de categorías aparece en varias pantallas; preferir helpers compartidos.
- No hay suite de tests frontend; la validación práctica es lint/build.
- `README.md` sigue siendo escaso para el producto real.
