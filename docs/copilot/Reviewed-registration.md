# Registro revisado con Nilo

Nilo interpreta un máximo de 20 movimientos con tipo e importe explícitos, separados por punto y coma o salto de línea. Ejemplo: `Gasto 25,50 en Supermercado; ingreso 100 en Otros`. Las categorías proceden de la familia; ninguna categoría está fijada en código. Si falta un dato o una fecha resulta ambigua, se corrige en la revisión.

1. Interpretar texto o dictado: no escribe movimientos.
2. Revisar cada importe, fecha, categoría y descripción. Opcionalmente activar «Recordar este alias para mi familia».
3. Revisar la propuesta final validada por el servidor.
4. Confirmar explícitamente el conjunto. La propuesta caduca en 15 minutos y pertenece al usuario y familia actuales.

Si una confirmación pierde la respuesta, solo se permite reintentar la misma propuesta; su identificador evita duplicados. Los borradores se descartan al cambiar usuario, familia o mes. La confirmación es atómica: un error en una fila impide guardar todas.

El dictado usa SpeechRecognition del navegador, donde esté disponible. Puede utilizar un servicio de transcripción del navegador; solo se inicia al pulsar «Dictar movimientos». El texto es editable, no se envía ni se confirma automáticamente. Hay alternativa por teclado. Se ha probado el ciclo mediante un reconocimiento simulado, no con micrófono real en todos los navegadores.

Requiere el backend `codex/nilo-confirmed-batches-20261113` y `ASSISTANT_ENABLED=true`. Endpoints: `assistant/movement-drafts/`, `assistant/movement-proposals/` y `assistant/movement-proposals/:id/confirm/`. No requiere proveedor IA. El historial conversacional y la escalada IA bajo demanda viven en una rama independiente.

Los registros son ingresos/gastos puntuales: no se adivinan vínculos con cuotas, planes ni pagos fijos. Los alias aprendidos son de categoría, con opción explícita al confirmar; no se sustituyen alias existentes por otra categoría silenciosamente.

Pruebas: confirmación separada de preparación, reintento con el mismo ID, categorías sin resolver, alias opt-in, cancelación sin commit, dictado sin envío automático y eliminación de borradores al cambiar de familia. Ejecutar `npm test`, `npm run lint`, `npm run build`.
