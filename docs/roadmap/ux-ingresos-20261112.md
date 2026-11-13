# Mejora UX de ingresos — contrato de implementación

Estado: especificación de trabajo; no hay funcionalidad implementada en este commit.

## Problema observado
En `src/pages/Budget.jsx`, la pestaña Ingresos separa movimientos reales y planes recurrentes. `IncomePlanMonthItem` ofrece acciones «Confirmar» y «Ajustar» que no explican su efecto. `handleCreateIncomePlan` confirma automáticamente el plan recién creado. `adjustIncomePlan` modifica la versión recurrente desde el mes elegido y crea un ingreso real: esto es distinto de registrar una nómina excepcional.

## Objetivo de producto
Desde Presupuestos > Ingresos, una única tarjeta por nómina/ingreso recurrente debe mostrar importe previsto, importe cobrado y estado «Pendiente de cobrar» o «Cobrado». Acción primaria «Registrar cobro» con importe precargado y fecha editable. El usuario puede registrar un importe diferente **solo para el mes actual**, sin alterar la planificación futura. Acción secundaria «Cambiar importe previsto» para modificar explícitamente la recurrencia desde un mes elegido, mostrando el efecto antes de confirmar. Ingresos puntuales conservan su flujo separado.

## Reglas y regresiones
- Crear un plan nunca debe registrar automáticamente un cobro.
- Confirmar el cobro debe crear un único `Income` vinculado al plan; evitar duplicados y manejar errores/reintentos.
- Un importe excepcional de un mes no debe alterar versiones futuras.
- Cambiar la recurrencia no debe crear un ingreso real implícitamente.
- Los balances deben distinguir ingreso real de previsto y evitar doble contabilización.
- Respetar mes cerrado, permisos de familia, roles, API y CSRF.
- No tocar autenticación ni introducir categorías hardcodeadas.
- Mobile-first: acción principal visible sin menú de tres puntos; edición y configuración secundarias.

## División de trabajo propuesta (no agentes lanzados)
1. Frontend UX: `Budget.jsx`, `IncomePlanMonthItem.jsx`, modal de cobro y etiquetas; tests de componentes.
2. Backend contrato: revisar `IncomePlan`, `IncomePlanVersion`, acciones `confirm`/`adjust`; diseñar operación de cobro puntual independiente de modificación recurrente; tests de idempotencia y meses cerrados.
3. QA e integración: probar nómina exacta, superior/inferior, plan creado sin cobro, modificación futura, permisos, móvil y actualización de totales.

## Validación antes de merge
Ejecutar `npm run lint`, `npm run build`, pruebas frontend relevantes y pruebas Django del dominio ingresos. Mantener PR en borrador hasta validar backend/frontend juntos. No fusionar ni desplegar automáticamente.
