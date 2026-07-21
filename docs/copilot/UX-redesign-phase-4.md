# Fase 4: conversación visual con Nilo

## Identidad

La hormiga se llama **Nilo**. Es un nombre breve, sereno, fácil de pronunciar en español y suficientemente neutral para no convertir la mascota en un personaje infantil. Su descriptor funcional es “tu hormiga financiera”.

El sistema visual inicial de Fase 4 fue sustituido en Fase 5 por el componente compartido `Nilo`. La anatomía, API, estados y rendimiento actuales se documentan en `Nilo-character-system.md`.

## Decisiones UX

1. **Conclusión antes que métricas.** La primera lectura combina Nilo, saludo personal, periodo y `response.summary`. No se calcula ni redacta una conclusión en frontend.
2. **Máximo tres insights.** Solo `alert` y `recommendation`, conservando su orden backend, ocupan la zona “Únicamente lo importante”. Los siguientes bloques siguen disponibles en detalle.
3. **Detalle progresivo.** Métricas, tablas y gráficas viven bajo “Los datos detrás”. Se abre automáticamente cuando el backend responde a un intent de detalle.
4. **Preguntas respaldadas.** Las seis acciones rápidas corresponden a intents ya registrados. No aparecen simulaciones de compra, vacaciones o comparaciones que backend no pueda resolver.
5. **Conversación sin chat.** El input es una única superficie tipo Messages. Cada respuesta reemplaza el análisis visible; no se construye historial, burbujas ni memoria.
6. **Estados con calma.** Aura, respiración y antenas se mueven lentamente. Atención y preocupación cambian expresión y color sin dramatismo; celebración usa tres partículas discretas.
7. **Acceso ubicuo.** `FloatingCopilot` abre `/copilot` desde las demás pantallas y desaparece dentro de la propia experiencia.
8. **Mobile first real.** En 320–390 px el flujo es avatar, mensaje, insights, acciones, input y detalle. Las columnas aparecen después, nunca antes.

## Límites respetados

- No se modificó backend, DTO, contrato visual, tools ni endpoint.
- No se añadieron cálculos, formatos financieros, recomendaciones o datos.
- `message`, `intent` y `arguments` viajan intactos al endpoint existente.
- El renderer por registro y su fallback desconocido siguen siendo la base de todos los bloques.

## Crítica del diseño

### ¿Qué partes todavía parecen un dashboard?

Las gráficas, tablas y `metric_grid` conservan inevitablemente una gramática analítica. Se ha reducido su densidad y están ocultas por defecto, pero cuando el usuario abre “Los datos detrás” vuelve a aparecer una lectura más cercana al dashboard. Las acciones rápidas también forman una cuadrícula, aunque su función es conversacional.

### ¿Qué mejoraría en una V2?

- Pedir al backend un bloque explícito `insight` con prioridad y tono para no reutilizar `alert` como conversación.
- Incorporar una respuesta contractual a `submit_answer` para que las preguntas de Nilo tengan continuidad real.
- Permitir historial corto y efímero definido por backend, sin introducir memoria frontend.
- Añadir un estado contractual de objetivo conseguido para activar `celebrating` con certeza, no por inferencia visual.
- Medir con usuarios si “Los datos detrás” debe abrirse automáticamente en más intents o permanecer siempre bajo demanda.
- Hacer que el floating copilot comunique un nuevo insight solo cuando backend proporcione un estado de novedad verificable.

## Capturas

Las capturas de aceptación deben cubrir 390 × 844, 768 × 1024 y 1440 × 1000, con la respuesta mensual cargada y el detalle progresivo cerrado. No deben generarse con datos inventados: se capturan contra el backend local autenticado.
