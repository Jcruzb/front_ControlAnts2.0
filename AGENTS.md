# ControlAnts 2.0 Frontend

Las instrucciones funcionales y de arquitectura existentes se mantienen en `AGENT.md` y en las skills enlazadas desde ese archivo. Este documento añade reglas de tooling compatibles; no sustituye esas instrucciones.

## Principios del proyecto

- Prioriza UX y estabilidad antes que velocidad de entrega.
- Evita sobreingeniería y conserva los flujos que ya funcionan.
- Las categorías son configurables y nunca deben quedar hardcodeadas.
- Si un cambio afecta contratos o comportamiento de backend y frontend, indícalo expresamente antes de cerrar la tarea.
- Respeta los contratos, validaciones y comandos de comprobación definidos en `AGENT.md`.

## Codebase Memory MCP

- Usa primero Codebase Memory MCP para localizar símbolos, entender relaciones entre módulos, seguir llamadas, detectar consumidores de endpoints, analizar impacto transversal y encontrar implementaciones relacionadas.
- Recurre a búsqueda textual y lectura directa cuando el índice sea insuficiente, necesites la implementación exacta, revises plantillas, estilos, textos o configuración, o sospeches que el índice está desactualizado.
- Nunca modifiques código basándote únicamente en el grafo. Abre y lee los archivos afectados, verifica los contratos y modelos reales y ejecuta las pruebas pertinentes.
- Este frontend y el backend `back_ControlAnts2.0` son repositorios independientes: selecciona explícitamente el proyecto correcto en las consultas y contrasta relaciones HTTP entre ambos cuando el cambio sea transversal.
