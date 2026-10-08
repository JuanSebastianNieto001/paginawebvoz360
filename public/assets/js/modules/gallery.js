/* ==========================================================================
   GALERÍA — carrusel centrado "VOZ360 por dentro"
   La foto activa queda grande al centro y las laterales se achican y atenúan
   según su distancia. Avanza sola cada 2 s (solo mientras está en pantalla) y
   se controla con flechas, puntos, clic en una foto, arrastre/deslizamiento y
   las teclas ← →. El fondo muestra la miniatura ya desenfocada de la foto
   activa (img/galeria/blur/), con un fundido entre dos capas.
   Estilos: css/sections/galeria.css
   ========================================================================== */
(function () {
  'use strict';

  var gallery = document.getElementById('galeria');
  if (!gallery) return;

  var AUTOPLAY_MS = 2000;   // cambia de foto cada 2 segundos
  var GAP = 16;             // separación entre fotos (igual que .gallery-track en CSS)
  var SWIPE_PX = 40;        // desplazamiento mínimo para considerar un arrastre

  var track = gallery.querySelector('.gallery-track');
  var outer = gallery.querySelector('.gallery-track-outer');
  var items = Array.prototype.slice.call(gallery.querySelectorAll('.gallery-item'));
  var counter = gallery.querySelector('.gallery-counter');
  var dotsWrap = gallery.querySelector('.gallery-dots');
  var bgLayers = gallery.querySelectorAll('.gallery-bg span');
  var bgIndex = 0, current = 0, timer = null, visible = false, dragged = false, startX = null;
  var pad2 = function (n) { return String(n).padStart(2, '0'); };

  /* ---------- Puntos de navegación ---------- */
  var dots = items.map(function (item, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gallery-dot';
    b.setAttribute('aria-label', 'Ir a la foto ' + (i + 1) + ': ' + item.querySelector('figcaption').textContent);
    b.appendChild(document.createElement('span'));
    b.addEventListener('click', function () { go(i, true); });
    dotsWrap.appendChild(b);
    return b;
  });

  /* Tamaño y opacidad según la distancia a la foto activa (0 = activa … 3+ = lejana) */
  function sizes() {
    var vw = outer.clientWidth;
    var h = Math.max(180, outer.clientHeight);
    var mobile = vw <= 768;
    return [
      { w: mobile ? vw * 0.78 : Math.min(vw * 0.38, 560), h: h, o: 1 },
      { w: mobile ? vw * 0.16 : Math.min(vw * 0.18, 260), h: h * 0.74, o: 0.55 },
      { w: mobile ? vw * 0.10 : Math.min(vw * 0.12, 180), h: h * 0.56, o: 0.28 },
      { w: mobile ? vw * 0.05 : Math.min(vw * 0.08, 120), h: h * 0.4, o: 0.12 }
    ];
  }

  /* Fondo: fundido a la miniatura desenfocada de la foto activa */
  function setBackground(i) {
    var src = items[i].querySelector('img').getAttribute('src').replace('/galeria/', '/galeria/blur/');
    var next = bgLayers[1 - bgIndex];
    next.style.backgroundImage = 'url("' + src + '")';
    next.classList.add('is-on');
    bgLayers[bgIndex].classList.remove('is-on');
    bgIndex = 1 - bgIndex;
  }

  /**
   * Muestra la foto `index`.
   * @param {number}  index    posición (se ajusta en ciclo)
   * @param {boolean} [manual] true si lo pidió la persona (reinicia el autoplay)
   * @param {boolean} [instant] sin transición (al cargar o redimensionar)
   */
  function go(index, manual, instant) {
    current = (index + items.length) % items.length;
    var s = sizes();
    if (instant) gallery.classList.add('no-anim');
    // Todas las fotos miden lo que la activa; la tarjeta las recorta (no se re-escalan)
    gallery.style.setProperty('--g-w', Math.round(s[0].w) + 'px');
    gallery.style.setProperty('--g-h', Math.round(s[0].h) + 'px');
    var widths = items.map(function (_, i) { return s[Math.min(3, Math.abs(i - current))].w; });
    var left = 0;
    for (var i = 0; i < current; i++) left += widths[i] + GAP;
    track.style.transform = 'translateX(' + (outer.clientWidth / 2 - (left + widths[current] / 2)) + 'px)';
    items.forEach(function (item, k) {
      var cfg = s[Math.min(3, Math.abs(k - current))];
      item.style.width = cfg.w + 'px';
      item.style.height = cfg.h + 'px';
      item.style.opacity = cfg.o;
      item.classList.toggle('is-active', k === current);
      item.setAttribute('aria-hidden', k === current ? 'false' : 'true');
    });
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === current); });
    counter.textContent = pad2(current + 1) + ' / ' + pad2(items.length);
    setBackground(current);
    if (instant) { void track.offsetWidth; gallery.classList.remove('no-anim'); }
    if (manual) restart();
  }

  /* ---------- Autoplay ---------- */
  function start() {
    if (timer || !visible) return;
    timer = setInterval(function () { go(current + 1); }, AUTOPLAY_MS);
  }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  /* ---------- Controles ---------- */
  gallery.querySelector('.gallery-prev').addEventListener('click', function () { go(current - 1, true); });
  gallery.querySelector('.gallery-next').addEventListener('click', function () { go(current + 1, true); });
  items.forEach(function (item, i) {
    item.addEventListener('click', function () { if (!dragged && i !== current) go(i, true); });
  });

  // Arrastrar con el mouse o deslizar con el dedo
  outer.addEventListener('pointerdown', function (e) { startX = e.clientX; dragged = false; });
  window.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > SWIPE_PX) {
      dragged = true;
      go(current + (dx < 0 ? 1 : -1), true);
      setTimeout(function () { dragged = false; }, 0);
    }
  });

  // Teclado: flechas, solo mientras la galería está en pantalla (y no se escribe en un campo)
  document.addEventListener('keydown', function (e) {
    if (!visible || (e.target.closest && e.target.closest('input, textarea, .bot-panel'))) return;
    if (e.key === 'ArrowLeft') go(current - 1, true);
    if (e.key === 'ArrowRight') go(current + 1, true);
  });

  // Solo avanza sola mientras está en pantalla
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0.35 }).observe(gallery);
  } else {
    visible = true;
  }

  window.addEventListener('resize', function () { requestAnimationFrame(function () { go(current, false, true); }); });
  requestAnimationFrame(function () { go(0, false, true); start(); });
})();
