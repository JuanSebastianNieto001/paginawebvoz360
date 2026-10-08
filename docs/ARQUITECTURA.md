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

Transversales: `base/animations.css` y `modules/reveal.js` (entrada al hacer scroll), `components/buttons.css` y `modules/buttons.js` (efectos de botones), `modules/perf.js` (animaciones y escenas fuera de pantalla).

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
| Nubes | Un elemento por nube, sin `filter: blur` ni `backdrop-filter`; 20 nubes en celular y 30 en PC. Con `ScrollTimeline` el recorrido se calcula una vez y el navegador lo reproduce en la GPU al ritmo del scroll; sin soporte, JS mueve las nubes solo cuando el scroll cambia | Recalcular el estilo de las nubes en cada cuadro era casi la mitad del trabajo en PC (20 → 58 fps). |
| Galería | Fondo con miniaturas ya desenfocadas (`galeria/blur/`); bordes con degradados en vez de `mask-image`; la foto no se re-escala en cada cuadro; `contain: layout` en el carrusel | El cambio de tamaño de las fotos solo recalcula el carrusel, no la página (25 → 50 fps en PC). |
| Montaña | Escena en capas apiladas (cielo en 4 degradados que se funden, estrellas, sol, luna, nubes, aves, cordilleras, niebla, montaña, sendero, muñequito y cima), cada una movida con `transform`/`opacity`; sendero muestreado una vez; los atributos SVG solo se escriben si cambian; la bandera ondea solo en la cima | Antes era un único SVG que se repintaba completo en cada cuadro (29 → 40 fps en celular, 32 → 42 en PC). |
| Tecnología | Sin `backdrop-filter` en tarjetas que se mueven; medidas en caché; barras, puntos y cursor de la ilustración son elementos HTML (`.tec-fx i`) animados en la GPU | Dentro del SVG obligaban a repintar la ilustración en cada cuadro. |
| Quiénes somos | La onda de audio usa `transform: scaleY` y no `height`; el fondo de puntos se desplaza con `transform` (no `background-position`); manchas de color con degradado radial (no `filter: blur`) | Animar `height`, `background-position` o un desenfoque obliga a recalcular o repintar en cada cuadro (13 → 50 fps en PC). |
| Instagram | Figuras desenfocadas: el filtro va en el hijo y la animación en el contenedor (el desenfoque se calcula una vez); botón de play sin `backdrop-filter` | El desenfoque animado se recalculaba en cada cuadro, y el del play, sobre el video. |
| Header | Fondo casi opaco, sin `backdrop-filter` | Desenfocaba lo que pasa por debajo en cada cuadro del scroll. |
| Global | Fuera de pantalla (`.is-offscreen`, margen de 150 px) las animaciones se **quitan**, no solo se pausan (una animación pausada sigue ocupando una capa en la GPU), y las escenas de nubes y montaña no se dibujan (`content-visibility: hidden`). La montaña además usa `.is-asleep` con margen 0. Los elementos con entrada al hacer scroll no tienen `will-change` permanente | Bajó de ~210 a ~110 capas en la GPU. |
| Bucles y `resize` | Los bucles `requestAnimationFrame` de la órbita de Tecnología y de las nubes solo existen con la sección en pantalla (y la órbita, con la ventana de detalle cerrada); fuera se cancelan. Los `resize` de galería, nubes, montaña y Tecnología se agrupan (120 ms) y en pantallas táctiles se ignoran si el ancho no cambió y el alto cambió menos de 120 px. El botón magnético mide su caja una vez al entrar el puntero | La barra de direcciones del celular dispara `resize` al hacer scroll y rehacía las animaciones de las nubes y el `viewBox` de la montaña; los bucles seguían pidiendo cuadros fuera de pantalla. |
| Bot | Los ojos parpadean con una animación corta cada 4,5 s (no una infinita) | La animación infinita recalculaba estilos en cada cuadro. |

Reglas generales: animar solo `transform` y `opacity`, y sobre elementos HTML (una animación dentro de un SVG repinta todo el SVG); no leer medidas del DOM (`offsetWidth`, `getBoundingClientRect`) dentro de un bucle de animación; no usar `filter: blur` ni `backdrop-filter` animados o sobre áreas grandes; no dejar `will-change` permanente en muchos elementos; en bucles con JS, escribir estilos y atributos solo si cambiaron.

## Accesibilidad

- Animaciones siempre activas (decisión del proyecto: muchos equipos corporativos tienen desactivados los efectos de Windows).
- Menú, bot y ventana de Tecnología se manejan con teclado: `Esc` cierra y el foco vuelve al botón que los abrió.
- Imágenes con `alt` descriptivo; las decorativas con `alt=""` o `aria-hidden`.
