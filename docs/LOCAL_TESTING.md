# Probar todas las mejoras localmente

Rama de ambos repositorios: `codex/integration-20261113`.
Las ramas de funciones siguen separadas para revisión. Esta rama reúne las mejoras
para probarlas juntas; no fusiona ni despliega nada en `main`.

## Descargar el frontend en tu carpeta habitual

Primero comprueba que no hay cambios locales pendientes. Si `git status --short`
muestra archivos, guarda esos cambios antes de cambiar de rama.

```sh
cd /Users/juancruzballadares/Desktop/Proyectos/front-controlAnts2.0
git status --short
git fetch origin
git switch --track origin/codex/integration-20261113
```

Si ya tienes creada esa rama local, utiliza estos dos comandos en lugar del último:

```sh
git switch codex/integration-20261113
git pull --ff-only origin codex/integration-20261113
```

Instala las versiones del archivo de dependencias y verifica:

```sh
npm ci
npm test
npm run lint
npm run build
```

## Iniciar el frontend

Con el backend de la misma rama ejecutándose en el puerto 8001:

```sh
VITE_API_BASE_URL=/api VITE_DEV_PROXY_TARGET=http://127.0.0.1:8001 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Abre http://127.0.0.1:5173. El proxy mantiene las cookies de sesión y CSRF; no hacen
falta tokens manuales. Las variables de este comando prevalecen sobre un destino
API configurado en `.env`.

## Backend compatible

En otra terminal, descarga la misma rama del backend:

```sh
cd /Users/juancruzballadares/Desktop/Proyectos/back_ControlAnts2.0
git status --short
git fetch origin
git switch --track origin/codex/integration-20261113
```

Si la rama local ya existe:

```sh
git switch codex/integration-20261113
git pull --ff-only origin codex/integration-20261113
```

Sigue [la guía del backend](https://github.com/Jcruzb/back_controlAnts2.0/blob/codex/integration-20261113/docs/LOCAL_INTEGRATION_20261113.md) (`docs/LOCAL_INTEGRATION_20261113.md`) para crear una base PostgreSQL local
separada, aplicar migraciones y arrancar en 8001. Nilo requiere
`ASSISTANT_ENABLED=true`; las consultas deterministas, el registro revisado y los
alias funcionan sin credenciales de IA. El proveedor `mock` permite probar la
confirmación de escalado sin llamadas externas. OpenAI conserva su configuración
exclusivamente en el backend.

## Comprobaciones manuales

1. En Presupuestos → Ingresos, crea un plan: el balance no debe subir y debe quedar
   pendiente. Registra un importe excepcional; solo debe cambiar lo cobrado en ese
   mes. Revisa el siguiente mes y confirma que conserva el importe previsto.
2. Cambia el importe previsto desde un mes elegido: no debe crear un cobro. Comprueba
   que un mes cerrado bloquea las modificaciones y que un miembro puede cobrar,
   pero no configurar el plan. Cambiar de mes cierra los diálogos abiertos.
3. En Nilo, formula una consulta conocida. Una pregunta no reconocida ofrece
   **Consultar con IA** y no usa proveedor hasta pulsarlo. Revisa el historial y
   comprueba que se limpia al cambiar de usuario, familia o periodo.
4. En **Registrar con Nilo**, escribe varios gastos/ingresos, interpreta, corrige
   fechas/categorías y revisa la confirmación final. Nada se registra hasta
   **Confirmar y registrar movimientos**. Cancelar la revisión no escribe.
5. Marca un alias de categoría para aprenderlo; solo queda guardado tras confirmar
   el conjunto y no se comparte con otra familia. El dictado, cuando el navegador
   lo permite, solo rellena texto editable. Si no está disponible, usa texto o el
   dictado del teclado. No se ha verificado un micrófono real en las pruebas.
6. En Financiaciones, crea una compra de 100 € en tres cuotas: 33,33 / 33,33 / 33,34.
   Crear deuda no cambia el gasto real. Pagar 10 € debe reducir la deuda a 90 € y
   afectar el balance una sola vez. Los reintentos del mismo pago conservan su
   identificador y no duplican gastos.
7. Simula un fallo de red: una carga fallida de financiaciones no debe mostrar deuda
   cero; una confirmación incierta debe permitir reintentar el mismo registro sin
   cambiar el conjunto o crear otro pago.

## Alcance de esta versión

El registro de Nilo crea movimientos puntuales, sin vincular automáticamente gastos
ni ingresos a planes existentes. Los alias son de categoría. El historial visible
no se envía como memoria conversacional a la IA. Las financiaciones usan el total
contractual introducido, sin cálculo de intereses, extractos, liquidación automática,
modificación de calendarios ni anulación de pagos. Las cuotas pendientes aparecen en
Financiaciones y no se incorporan a obligaciones planificadas de Presupuestos.

Los tests no consumen IA externa. La compilación puede mostrar el aviso existente
sobre un archivo de más de 500 kB; no impide generar la aplicación.
