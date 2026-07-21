# Nilo: sistema de personaje

## Tecnología elegida

Nilo usa **PNG RGBA de alta resolución + CSS + React mínimo**.

- `public/nilo-character.png` es el recorte transparente del render maestro aprobado y conserva exactamente su anatomía, materiales, iluminación y rasgos.
- CSS mantiene la proporción vertical del personaje y anima únicamente `transform`, `translate`, `rotate` y `opacity`.
- React normaliza estados, aplica props de presentación y coordina la interacción accesible.
- La reacción al puntero solo solicita un frame cuando existe un evento real; no mantiene un loop JavaScript.

### Alternativas descartadas

- **SVG redibujado a mano:** alteraba las proporciones, los ojos, las cejas, la anatomía y el material respecto al render maestro.
- **Canvas 2D:** necesita redibujado, pierde semántica y complica los estados declarativos.
- **WebGL, PixiJS y ThreeJS:** añaden GPU, batería y bundle sin aportar valor suficiente a un personaje estático 2.5D.
- **Lottie:** introduce una cadena externa de After Effects y no reproduce el render maestro sin crear una animación nueva.
- **Framer Motion:** resolvería las mismas transformaciones añadiendo una dependencia.

## API

```jsx
import Nilo from "../components/Nilo";

<Nilo
  state="thinking"
  size="lg"
  interactive
  showAura
  showShadow
  animate
  reducedMotion={false}
  className="mi-clase"
/>
```

`size` acepta `xs`, `sm`, `md`, `lg`, `xl`, `floating`, `compact`, `hero`, un número en píxeles o cualquier longitud CSS válida. El valor controla la altura; el ancho se calcula con la proporción original del render.

## Estados

| Estado | Halo | Postura y movimiento |
|---|---|---|
| `greeting` | azul | ligera inclinación |
| `satisfied` | verde | relajada |
| `thinking` | azul-violeta | inclinación reflexiva |
| `analyzing` | cian | presencia reforzada |
| `waiting` | neutro | estable |
| `surprised` | cian | elevación y escala suaves |
| `concerned` | amarillo | postura contenida |
| `alert` | naranja | postura elevada |
| `celebrating` | morado | rebote y partículas |
| `idle` | azul tenue | respiración lenta |

Los eventos `loading`, `good_news` y `warning` se normalizan respectivamente a `thinking`, `celebrating` y `concerned`. Los aliases de Fase 4 continúan funcionando.

El rostro permanece idéntico al render aprobado en todos los estados. El contexto emocional se comunica mediante postura, movimiento, halo, color y partículas, evitando deformar o reinterpretar al personaje.

## Anatomía e identidad

La silueta incluye antenas altas, cabeza expresiva, iris ámbar, cejas volumétricas, tórax, pedúnculo, abdomen segmentado, brazos con manos y piernas articuladas. El material mate y la iluminación superior izquierda forman parte de la identidad visual.

La señal luminosa azul-cian-violeta del pecho actúa como firma de Nilo. Se conserva en todas las escalas y evita que parezca un robot genérico.

`public/nilo.svg` es un contenedor compatible que referencia el mismo PNG maestro para documentación, branding y superficies que no montan React. La experiencia animada usa siempre el componente compartido.

## Animación e interacción

- Respiración de 5,6 segundos; 8,2 segundos en idle.
- Microinclinación corporal según el estado.
- Elevación y escala contenidas en surprised, alert y celebrating.
- Reacción breve del personaje completo al click.
- Seguimiento del cursor limitado a 1,2 px y 1,4 grados.
- Halo con dos anillos tenues, núcleo respiratorio y cuatro partículas.

`animate=false`, `reducedMotion=true` y `prefers-reduced-motion` detienen las animaciones. Los cambios de estado conservan transiciones breves para dar continuidad visual.

## Rendimiento

El PNG maestro mide 1024 × 1536 px y se carga una sola vez desde `public`. No hay intervalos JavaScript, canvas, WebGL ni librerías de animación. El único `requestAnimationFrame` se solicita durante un movimiento real del cursor y actualiza variables CSS.

## Accesibilidad

- Nilo no interactivo usa `role="img"` y un label específico del estado.
- Nilo interactivo es un botón nativo con foco visible y activación de teclado.
- La imagen interna tiene `alt=""` porque el nombre accesible vive en el contenedor.
- El halo y las partículas son decorativos.
- Se respetan alto contraste y movimiento reducido.

## Laboratorio

`/nilo-lab` permite cambiar manualmente los diez estados, cinco escalas, interacción, halo, sombra, animación y movimiento reducido. Incluye una matriz de 32, 64, 128, 256 y 512 px.

## Limitaciones y mejoras futuras

- Las partes anatómicas no se deforman por separado para evitar que el personaje deje de coincidir con la referencia aprobada.
- Para animación facial real será necesario producir renders maestros adicionales con identidad bloqueada o un rig 3D basado en el mismo modelo.
- Puede añadirse una variante específica de icono para superficies de 16–24 px si se necesita más legibilidad que la figura completa.
- Debe medirse el coste de filtros de halo en Android de gama baja antes de añadir efectos nuevos.
