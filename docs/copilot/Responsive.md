# Responsive

La referencia primaria es 320–390 px. No hay anchos fijos ni scroll horizontal deliberado.

- `MetricGrid` usa columnas automáticas según el espacio disponible.
- `SimpleTable` se convierte en tarjetas por fila en móvil.
- Botones, leyendas y acciones permiten wrap.
- Las gráficas usan un contenedor responsive; sus valores también aparecen como una lista legible fuera del canvas SVG.
- El avatar ocupa la primera pantalla móvil y se reduce progresivamente sin perder expresión.
- En escritorio, avatar y mensaje comparten una composición de dos columnas con los insights; el orden DOM sigue siendo conversacional.
- Las acciones rápidas pasan de una columna a dos desde 420 px y a tres únicamente en escritorio.

Desde `md`, las tablas recuperan su estructura tabular y el resto de bloques amplía espaciado sin duplicar componentes.
