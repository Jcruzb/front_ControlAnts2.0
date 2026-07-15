# Bloques visuales

El registro v1 soporta `summary_card`, `metric_grid`, `alert`, `simple_table`, `bar_chart`, `line_chart`, `recommendation`, `question` y `action_group`.

- Las métricas muestran `formatted_value` del backend y conservan `value` como fallback literal.
- Las tablas usan tarjetas por fila en móvil y tabla semántica desde `md`.
- Las gráficas reciben `data`, `series` y `x_axis` sin agregaciones frontend. La leyenda y una lista visible reproducen los valores recibidos; existe además una tabla accesible.
- `recommendation` se distingue de una alerta y `question` representa una pregunta, no un campo de chat.

Cada componente acepta estados `loading`, `error` y `permission`; la ausencia de contenido produce su estado vacío.
