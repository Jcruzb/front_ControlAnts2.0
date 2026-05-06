# AGENT.md

Nombre del software: `ControlAnts 2.0 Frontend`.

## Propósito

Aplicación frontend en `React + Vite` para gestionar:

- presupuesto mensual,
- gastos manuales,
- gastos fijos,
- ingresos manuales,
- ingresos recurrentes,
- categorías,
- importación y exportación masiva mediante Excel,
- paneles visuales en dashboard.

El frontend depende de un backend Django bajo el prefijo `/api/` y trabaja con sesión autenticada por cookie + CSRF.

## Stack vigente

- `React 19`
- `react-router-dom 7`
- `axios`
- `Vite`
- `Tailwind CSS 4`
- `xlsx` para importación/exportación

Scripts útiles:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Arquitectura real

La aplicación está organizada por capas simples:

- `src/app`: shell general, layout y router.
- `src/context`: estado global de autenticación y mes/año activo.
- `src/hooks`: accesos finos a contexto.
- `src/services`: integración con backend.
- `src/pages`: vistas principales.
- `src/components`: UI reutilizable y modales.
- `src/utils`: helpers de fechas y Excel.

El patrón dominante es:

1. la vista obtiene `year/month` desde `BudgetMonthProvider`,
2. carga datos desde `services/*` o `api`,
3. normaliza respuestas en la propia pantalla,
4. renderiza tarjetas, listas o modales,
5. tras mutaciones, refresca el bloque afectado.

No existe una capa de hooks de dominio consolidada todavía. La lógica de carga y normalización sigue bastante repartida entre páginas.

## Rutas principales

- `/` -> `Budget`
- `/dashboard` -> `Dashboard`
- `/expenses` -> `ExpensesList`
- `/expenses/new` -> `AddExpense`
- `/incomes` -> `IncomesList`
- `/recurring` -> `RecurringPayments`
- `/account` -> `Account`
- `/login` -> `Login`
- `/register` -> `Register`

`Budget` es ahora la pantalla principal del producto.

## Contextos globales

### Auth

Archivo clave: [src/context/AuthContext.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/context/AuthContext.jsx)

Responsabilidades:

- bootstrap de sesión con `/auth/me/`
- login, register y logout
- exponer `user`, `profile`, `family`, `authenticated`, `initialized`
- sincronizar la sesión con payloads completos de `/auth/me/` cuando una pantalla de cuenta actualiza perfil

### Auth / Cuenta

Archivo clave: [src/services/authApi.js](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/services/authApi.js)

Contratos usados:

- `GET /auth/me/`
- `PATCH /auth/me/`
- `POST /auth/change-password/`

Observación:

- `PATCH /auth/me/` devuelve el payload completo y debe reflejarse en `AuthContext`.
- la pantalla de cuenta mantiene formularios separados para datos personales y cambio de contraseña.

Notas:

- la app usa cookies de sesión, no tokens manuales.
- el router espera que `initialized` sea fiable antes de decidir redirecciones.

### Budget Month

Archivo clave: [src/context/BudgetMonthProvider.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/context/BudgetMonthProvider.jsx)

Responsabilidades:

- mantener `year/month`
- navegación entre meses
- `resetToCurrentMonth`

Estado actual:

- corregido para recalcular el mes real al hacer reset.

## Servicios críticos

### API base

Archivo clave: [src/services/api.js](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/services/api.js)

Responsabilidades:

- instancia `axios`
- gestión de CSRF
- `unwrapCollectionResponse`
- `getApiErrorMessage`

Observaciones:

- buena base para Django con sesión.
- muchas pantallas dependen de `unwrapCollectionResponse` para tolerar respuestas paginadas.

### Categorías

Archivo clave: [src/services/categories.js](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/services/categories.js)

Responsabilidades:

- obtener y crear categorías.

Observación importante:

- el frontend ya está preparado para respuestas paginadas.
- varias vistas dependen de `category_detail`, `category_name` o `category` con formas distintas.

### Miembros / pagadores

Archivo clave: [src/services/familyMembers.js](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/services/familyMembers.js)

Contrato usado:

- `GET /family/members/`

Responsabilidades:

- obtener miembros de familia disponibles para el selector `Quién paga`.
- devolver colecciones normalizadas con `unwrapCollectionResponse`.

Uso actual:

- `AddExpense`
- `ExpensesList` / `ExpenseFormModal`
- `RecurringPayments` / `RecurringPaymentForm`
- `Budget` / `QuickAddExpense`

Notas:

- `payer` es opcional en frontend.
- si no se selecciona pagador, el payload no envía `payer` y el backend decide el fallback.
- los gastos antiguos sin `payer` deben renderizar sin ruido, no como error.

### Ingresos recurrentes

Archivo clave: [src/services/incomePlans.js](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/services/incomePlans.js)

Contratos usados:

- `GET /income-plans/month/?year=&month=`
- `POST /income-plans/`
- `PATCH /income-plans/:id/`
- `DELETE /income-plans/:id/`
- `POST /income-plans/:id/confirm/?year=&month=`
- `POST /income-plans/:id/adjust/?year=&month=`

Observación:

- `confirm` y `adjust` requieren `year/month` explícitos.
- este contrato ya está cableado correctamente en frontend.
- el backend espera que `adjust` aplique desde el mes seleccionado hacia adelante; el frontend debe enviar siempre el `year/month` activo de `BudgetMonthProvider`.
- después de ajustar, refrescar el mes actual y no conservar importes anteriores en estado local.

### Importación/exportación Excel

Archivo clave: [src/utils/spreadsheet.js](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/utils/spreadsheet.js)

Fortalezas:

- carga diferida de `xlsx`
- parsing razonable de fechas e importes
- generación de workbooks reutilizable

Uso actual:

- gastos
- ingresos
- gastos fijos

## Vistas clave

### Budget

Archivo clave: [src/pages/Budget.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/pages/Budget.jsx)

Es la vista más compleja del sistema.

Responsabilidades actuales:

- resumen del mes
- navegación mensual
- separación UX entre `Gastos` e `Ingresos`
- filtros de gastos por búsqueda, estado, orden y categoría
- registro rápido de pagos
- alta, edición, ajuste, confirmación y borrado de ingresos planificados
- muestra `payer_detail` cuando el backend lo devuelve en items o pagos

Dependencias de contrato backend:

- `/budget/`
- `/incomes/`
- `/income-plans/month/`
- `/family/members/`

Riesgo actual:

- el filtro de categoría en `Gastos` depende de que `/budget/` devuelva `category_detail` o `category_name` de forma consistente.
- hoy el backend no homogeneiza del todo `planned` y `recurring`, por eso pueden aparecer entradas como `Sin categoría`.

### Dashboard

Archivo clave: [src/pages/Dashboard.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/pages/Dashboard.jsx)

Responsabilidades:

- resumen visual del mes
- gráficas de distribución y flujo
- acceso rápido a ingresos

Observación:

- ya no debe disparar generación automática delicada de recurrentes desde frontend.

### ExpensesList

Archivo clave: [src/pages/ExpensesList.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/pages/ExpensesList.jsx)

Responsabilidades:

- listado de gastos
- filtros y ordenación
- filtro por pagador
- edición de pagador opcional
- importación masiva
- exportación a Excel

### IncomesList

Archivo clave: [src/pages/IncomesList.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/pages/IncomesList.jsx)

Responsabilidades:

- listado de ingresos
- edición y borrado
- importación masiva
- exportación a Excel

### RecurringPayments

Archivo clave: [src/pages/RecurringPayments.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/pages/RecurringPayments.jsx)

Responsabilidades:

- CRUD de gastos fijos
- selector y filtro de pagador opcional
- muestra `Paga: nombre` cuando existe `payer_detail`
- importación masiva
- exportación de plantilla y datos existentes

## Estado técnico auditado

### Fortalezas

- estructura de carpetas clara para un SPA mediano.
- autenticación con sesión y CSRF bien resuelta.
- `BudgetMonthProvider` unifica la navegación mensual.
- UX del presupuesto mejorada con separación entre ingresos y gastos.
- importación/exportación Excel ya consolidada en varias áreas.
- `lint` y `build` pasan.

### Riesgos y deuda técnica real

1. `README.md` sigue siendo prácticamente el de plantilla Vite.
   No refleja el producto ni el dominio.

2. Hay normalización de categorías y payloads repetida en varias pantallas.
   Ejemplos:
   - `Budget.jsx`
   - `ExpensesList.jsx`
   - `IncomesList.jsx`
   - `Dashboard.jsx`

3. El frontend depende de contratos backend no totalmente homogéneos.
   El caso más visible ahora mismo es `/budget/`, donde `planned` y `recurring` no siempre exponen la categoría con la misma forma.

4. Sigue habiendo `console.log` / `console.error` dispersos.
   Casos visibles:
   - [src/pages/Budget.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/pages/Budget.jsx)
   - [src/pages/Dashboard.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/pages/Dashboard.jsx)
   - [src/components/PlannedExpensePlanForm.jsx](/Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0/src/components/PlannedExpensePlanForm.jsx)

5. No hay suite de tests frontend visible.
   La validación actual depende de `eslint` y `vite build`.

6. `Budget.jsx` concentra demasiada responsabilidad.
   Funciona, pero sería un buen candidato a extracción futura en:
   - hooks de dominio,
   - helpers de contratos,
   - subcomponentes de secciones.

## Contratos backend especialmente sensibles

Estos endpoints deben mantenerse estables o documentarse explícitamente si cambian:

- `/api/budget/`
- `/api/incomes/`
- `/api/expenses/`
- `/api/categories/`
- `/api/recurring-payments/`
- `/api/income-plans/`
- `/api/income-plans/month/`
- `/api/income-plans/:id/confirm/`
- `/api/income-plans/:id/adjust/`

Regla práctica:

- si un endpoint devuelve categorías, intentar siempre incluir:
  - `category`
  - `category_name`
  - `category_detail`

Esto reduce muchísimo lógica defensiva en frontend.

## Recomendaciones prioritarias

1. Arreglar el contrato de `/budget/` para homogeneizar categorías en `planned` y `recurring`.
2. Sustituir normalizaciones duplicadas por helpers compartidos.
3. Limpiar logs de depuración residuales.
4. Actualizar `README.md` con setup real, rutas y dependencias de backend.
5. Añadir tests mínimos para:
   - helpers de fechas,
   - parsing de Excel,
   - normalización de categorías,
   - flujos de `Budget` con payloads mockeados.

## Convenciones para futuros cambios

- Mantener `year/month` como fuente de verdad desde `BudgetMonthProvider`.
- En ajustes de ingresos recurrentes, comunicar al usuario: `Este ajuste se aplicará desde este mes en adelante.`
- Al auditar `adjust`, verificar que:
  - el click en `Ajustar` usa `year/month` actuales,
  - el submit envía esos parámetros,
  - el mes actual se refresca tras guardar,
  - al navegar al mes siguiente se consulta otra vez `/api/income-plans/month/?year=&month=`,
  - no queda caché local con el importe anterior.
- No asumir nunca una forma única de categoría sin inspeccionar el payload real.
- Reutilizar `getApiErrorMessage` para feedback visible al usuario.
- Si se añade una nueva importación Excel, reutilizar `BulkImportModal` y `utils/spreadsheet.js`.
- Si un flujo depende de backend mensual, comprobar siempre:
  - navegación de mes,
  - reentrada a la pantalla,
  - idempotencia,
  - no duplicación.

## Validación mínima antes de cerrar cambios

- `npm run lint`
- `npm run build`

Cuando el cambio toque contratos backend:

- revisar payload real en red,
- verificar navegación entre meses,
- comprobar que no rompe Budget, Dashboard y listados.

## Estado al día de esta auditoría

- La app compila y lint pasa.
- La vista `Budget` ya está simplificada en dos modos: `Gastos` e `Ingresos`.
- El filtro por categoría en `Gastos` existe, pero su precisión depende de que el backend exponga correctamente los datos de categoría en `/budget/`.
- La mayor mejora inmediata ya identificada está en alinear mejor el contrato backend para categorías y reducir duplicación de normalización en frontend.
