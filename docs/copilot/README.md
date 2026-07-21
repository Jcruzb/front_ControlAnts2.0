# Renderer del Copiloto Financiero

El frontend del Copiloto es una conversación visual construida sobre bloques versionados. El backend es la única fuente de verdad: decide el intent, consulta datos, calcula métricas, redacta explicaciones y devuelve `blocks`. Nilo, la hormiga financiera de ControlAnts, presenta esas conclusiones sin reinterpretarlas.

La superficie vive en `src/copilot/` y se abre en `/copilot`. La página solicita `monthly_summary` con el año y mes del `BudgetMonthProvider`. El input envía `message` intacto al mismo endpoint; no contiene GPT, Markdown, streaming, memoria, voz ni lógica financiera.

El rediseño conversacional de Fase 4 se documenta en `UX-redesign-phase-4.md`. El sistema premium de personaje de Fase 5 vive en `src/components/Nilo/` y se documenta en `Nilo-character-system.md`.

Validación: `npm test`, `npm run lint` y `npm run build`.
