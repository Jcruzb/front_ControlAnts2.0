# Accesibilidad

Los bloques usan regiones, encabezados y tablas semánticas. Alertas críticas usan `role="alert"`; estados informativos usan `role="status"`. Los gráficos incluyen leyenda, valores visibles y una tabla para lectores de pantalla.

Todas las acciones son botones nativos, funcionan con teclado y muestran foco de alto contraste. Iconos decorativos usan `aria-hidden`. Los textos y superficies siguen la paleta oscura de ControlAnts con contraste suficiente.

Cada estado de Nilo expone un nombre accesible independiente de la expresión visual. En modo interactivo es un botón nativo con foco visible; en modo pasivo usa `role="img"`. Las animaciones se desactivan con `prefers-reduced-motion` o la prop `reducedMotion`. El input tiene label explícito, límite contractual de 200 caracteres y errores anunciados mediante `role="alert"`.
