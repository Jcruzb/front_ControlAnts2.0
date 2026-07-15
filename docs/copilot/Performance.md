# Rendimiento

Cada componente registrado está memoizado. El renderer conserva las referencias recibidas y no crea modelos financieros derivados.

`VisibleBlock` usa `IntersectionObserver` con margen anticipado de 240 px: muestra un skeleton ligero y monta el bloque antes de que entre en pantalla. En navegadores sin soporte y en renderizado de pruebas, muestra el bloque inmediatamente.

La optimización es deliberadamente pequeña: no hay virtualización compleja, caché financiera ni normalización duplicada.
