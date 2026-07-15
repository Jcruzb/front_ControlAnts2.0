# Renderer del Copiloto Financiero

El frontend del Copiloto es un renderer de bloques visuales versionados. El backend es la única fuente de verdad: decide el intent, consulta datos, calcula métricas, redacta explicaciones y devuelve `blocks`. El frontend muestra esos campos y coordina acciones permitidas.

La superficie vive en `src/copilot/` y se abre en `/copilot`. La página solicita `monthly_summary` con el año y mes del `BudgetMonthProvider`; no contiene chat, Markdown, streaming, memoria, voz ni lógica financiera.

Validación: `npm test`, `npm run lint` y `npm run build`.
