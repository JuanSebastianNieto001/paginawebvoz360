# Arquitectura

El sitio es de una sola página (`public/index.html`), más dos páginas legales. No hay proceso de compilación: el navegador recibe exactamente los archivos de `public/`.

## Secciones de la página

Cada sección tiene su hoja de estilos y, si tiene comportamiento, su módulo de JavaScript. El HTML indica en el comentario de cada sección qué archivos la controlan.

| # | Sección | HTML (id / clase) | CSS | JS |
|---|---|---|---|---|
| 0 | Intro (video del logo) | `#intro` | `sections/intro.css` | `modules/intro.js` |
| 1 | Portada + header | `.hero`, `#site-header` | `sections/hero.css`, `layout/header.css` | `modules/header.js` |
| 2 | Transición de nubes | `.cloud-transition` | `sections/clouds.css` | `modules/clouds.js` |
| 3 | Quiénes somos | `#nosotros` | `sections/nosotros.css` | `modules/nosotros.js` |
| 4 | Galería | `#galeria` | `sections/galeria.css` | `modules/gallery.js` |
| 5 | Servicios | `#servicios` | `sections/servicios.css` | — |
| 6 | Tecnología | `#tecnologia` | `sections/tecnologia.css` | `modules/tecnologia.js` |
| 7 | Instagram | `#instagram` | `sections/instagram.css` | `modules/instagram.js` |
| 8 | Final (montaña) | `#vzf` | `sections/final.css` | `modules/final.js` |
| 9 | Footer | `.footer` | `layout/footer.css` | `modules/perf.js` (año) |
| 10 | Bot Voz360 | `#bot` | `components/bot.css`, `components/forms.css` | `modules/bot.js`, `modules/forms.js` |

Transversales: `base/animations.css` y `modules/reveal.js` (entrada al hacer scroll), `components/buttons.css` y `modules/buttons.js` (efectos de botones), `modules/perf.js` (pausa de animaciones fuera de pantalla).

## CSS

- **Orden de carga = orden de la cascada.** Los `<link>` de `index.html` van en este orden y no debe cambiarse sin revisar:
  `base/fonts → base/tokens → base/base → base/animations → components/buttons → sections/intro → sections/clouds → layout/header → sections/hero → sections/nosotros → sections/galeria → sections/servicios → sections/tecnologia → sections/instagram → sections/final → components/forms → layout/footer → components/bot`
- **Tokens** (`base/tokens.css`): colores del manual de marca, tipografías, margen lateral (`--gutter`) y curva de animación (`--ease`). Cualquier color nuevo debe salir de aquí.
- **Responsive**: cada archivo contiene sus propias reglas `@media` al final. Cortes usados: 1200 px (tablet grande), 960 px (menú hamburguesa), 900 px (Tecnología compacta), 760/640 px (móvil). Además hay reglas por **altura** (`max-height`) para que las secciones visuales quepan en una pantalla.
- **Secciones de una pantalla**: portada, galería, servicios, tecnología e Instagram miden `100svh` y usan `scroll-snap-align: start`.
- Tecnología, Instagram y Final usan un formato compacto (sin espacios) heredado del diseño original; se conserva para no alterar el resultado.

## JavaScript

- Todos los módulos son funciones autoejecutables (`(function () { … })()`) en modo estricto, sin variables globales. Lo único global es `window.VOZ360.config` (`config.js`).
- Se cargan con `defer`, en el orden de la tabla. `head.js` es el único que se carga sin `defer`, porque debe actuar antes de pintar la página.
- No hay scripts en línea en el HTML: la Content-Security-Policy los prohíbe (`script-src 'self'`).
- Cada módulo empieza verificando que su sección exista, así se puede quitar una sección del HTML sin romper nada.

## Rendimiento (decisiones importantes)

Estas decisiones se tomaron midiendo con la CPU limitada a 4× (equipos modestos). **No revertirlas sin medir.**

| Dónde | Decisión | Por qué |
|---|---|---|
| Nubes | Un elemento por nube, sin `filter: blur` ni `backdrop-filter`; menos nubes en celular o con ≤ 4 núcleos | Los filtros sobre toda la pantalla eran lo más costoso (7 → 12 fps). |
| Galería | Fondo con miniaturas ya desenfocadas (`galeria/blur/`); bordes con degradados en vez de `mask-image`; la foto no se re-escala en cada cuadro | 10 → 22 fps al cambiar de foto. |
| Montaña | Nubes con degradado radial en vez de `feGaussianBlur`; sendero con `stroke-dashoffset` | 6 → 23 fps al hacer scroll. |
| Tecnología | Sin `backdrop-filter` en tarjetas que se mueven; medidas en caché; animaciones de la ilustración en una capa SVG aparte (`.tec-fx`) | El diseño se recalculaba en cada cuadro. |
| Quiénes somos | La onda de audio usa `transform: scaleY` y no `height` | Animar `height` recalculaba el diseño de **toda la página** 60 veces por segundo. |
| Global | `.is-offscreen` pausa las animaciones CSS de las secciones que no se ven | Ahorra trabajo mientras se está en otra sección. |

Reglas generales: animar solo `transform` y `opacity`; no leer medidas del DOM (`offsetWidth`, `getBoundingClientRect`) dentro de un bucle de animación; no usar filtros de desenfoque en vivo sobre áreas grandes.

## Accesibilidad

- Animaciones siempre activas (decisión del proyecto: muchos equipos corporativos tienen desactivados los efectos de Windows).
- Menú, bot y ventana de Tecnología se manejan con teclado: `Esc` cierra y el foco vuelve al botón que los abrió.
- Imágenes con `alt` descriptivo; las decorativas con `alt=""` o `aria-hidden`.
