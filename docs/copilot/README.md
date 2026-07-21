# Renderer del Copiloto Financiero

El frontend del Copiloto es una conversación visual construida sobre bloques versionados. El backend es la única fuente de verdad: decide el intent, consulta datos, calcula métricas, redacta explicaciones y devuelve `blocks`. Nilo, la hormiga financiera de ControlAnts, presenta esas conclusiones sin reinterpretarlas.

La superficie vive en `src/copilot/` y se abre en `/copilot`. La página solicita `monthly_summary` con el año y mes del `BudgetMonthProvider`. El input envía `message` intacto junto al periodo activo al mismo endpoint; no contiene tokens, SDK de IA ni lógica financiera. El backend conserva la sesión y el tenant, consulta datos reales y puede usar un proveedor externo únicamente para enrutar preguntas libres.

La clave y el modelo nunca se configuran con variables `VITE_*`: pertenecen al entorno privado del backend. Los atajos e intents conocidos siguen funcionando de forma determinista aunque el proveedor externo esté desactivado.

El rediseño conversacional de Fase 4 se documenta en `UX-redesign-phase-4.md`. El sistema premium de personaje de Fase 5 vive en `src/components/Nilo/` y se documenta en `Nilo-character-system.md`.

Validación: `npm test`, `npm run lint` y `npm run build`.
