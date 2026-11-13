# Conversión de un gasto existente a tarjeta o financiación

Rama frontend y backend: `codex/expense-financing-conversion-20261113`.
Base: `codex/integration-20261113`; no se fusiona en `main`.

## Comportamiento

En **Gastos → Abrir opciones → Convertir a tarjeta o financiación** (también desde Editar), un administrador puede vincular un gasto ya registrado a una compra. El importe existente se considera un pago real **ya realizado**: se conserva el mismo movimiento con su importe, fecha, categoría, pagador y vínculos con el presupuesto. No es una opción para convertir un movimiento aún no pagado ni corregir lo que ya se abonó.

El total de la compra incluye lo ya pagado. Solo la diferencia positiva se reparte en cuotas pendientes. Para vincular un pago completo a una tarjeta, se selecciona una tarjeta existente: no se genera deuda ni calendario pendiente. La pantalla permite revisar y confirmar; cancelar no escribe datos. Las tarjetas nuevas se crean por separado en Financiaciones.

El vínculo de un pago recurrente o planificado se conserva. La conversión **no cancela ni modifica la definición de pagos futuros**; deberá revisarse por separado cuando corresponda.

Una vez vinculado, el gasto muestra **Ver financiación · pago protegido** y no ofrece edición/eliminación, de acuerdo con las protecciones del backend. Financiaciones muestra el pago inicial conservado y, si existen, las cuotas restantes.

## Contrato transversal

Requiere primero el backend de esta misma rama y su migración aditiva.

- `POST /api/expenses/:id/convert-to-financing/`: nombre, cuenta opcional, total incluido lo pagado, `installment_count` (cuotas **pendientes**, 0 si pago completo), primera fecha pendiente o `null`, `confirmed: true`, UUID de idempotencia y snapshot `expected_expense` completo del gasto guardado.
- La categoría de la compra solo se envía cuando el gasto recibido carece de categoría; no modifica el movimiento original.
- El snapshot incluye importe, fecha, categoría, pagador, descripción, mes y vínculos planificados/recurrentes. El backend rechaza datos obsoletos o familias/meses no permitidos.
- `Expense.financing` identifica un pago protegido; la compra expone `initial_payment` y `source_expense`.
- Ante resultado ambiguo, la UI bloquea cambios y reutiliza exactamente el cuerpo y UUID. Esto cubre también una respuesta correcta seguida de error al refrescar la lista.

## Descargar y probar localmente

Con ambos repositorios limpios, sin descartar cambios locales:

```sh
cd "/Users/juancruzballadares/Documents/ChatGPT/controlAnts 2.0/front_ControlAnts2.0"
git fetch origin
git switch codex/expense-financing-conversion-20261113
git pull --ff-only origin codex/expense-financing-conversion-20261113
npm ci
npm test
npm run lint
npm run build
VITE_API_BASE_URL=/api VITE_DEV_PROXY_TARGET=http://127.0.0.1:8001 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Prepara el backend de la misma rama en una base de datos **aislada**, siguiendo su documentación de integración. No apuntes las pruebas a producción ni uses credenciales de una familia real. El frontend estará en `http://127.0.0.1:5173`, con proxy a la API local en el puerto 8001.

Ensayo manual: crea un gasto de prueba de 100 €, conviértelo en compra de 250,01 € con tres cuotas pendientes y confirma. Debe seguir existiendo un solo gasto de 100 €, la compra debe mostrar 100 € pagados y 150,01 € pendientes. Pagar una cuota crea únicamente ese nuevo pago. Para el caso sin deuda, vincula otro gasto a una tarjeta manteniendo el mismo total. Comprueba cancelación, rechazo de total inferior, protección del gasto vinculado y ausencia de la opción para miembros sin permisos de administración.

Validación frontend: 28 pruebas Node + 114 Vitest (10 nuevas de conversión), lint y build correctos. La verificación E2E real y el despliegue se registran por separado cuando finalicen.
