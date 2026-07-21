# Rendimiento

Cada componente registrado está memoizado. El renderer conserva las referencias recibidas y no crea modelos financieros derivados.

`VisibleBlock` usa `IntersectionObserver` con margen anticipado de 240 px: muestra un skeleton ligero y monta el bloque antes de que entre en pantalla. En navegadores sin soporte y en renderizado de pruebas, muestra el bloque inmediatamente.

La optimización es deliberadamente pequeña: no hay virtualización compleja, caché financiera ni normalización duplicada.

La ruta `/copilot` continúa cargándose mediante `React.lazy`. Nilo no requiere descarga raster ni librería de animación; respiración, parpadeo, antenas, halo y expresiones usan CSS. El seguimiento ocular solicita `requestAnimationFrame` únicamente al recibir movimiento. `FloatingCopilot` reutiliza el mismo componente y `/nilo-lab` se carga en un chunk lazy independiente.
