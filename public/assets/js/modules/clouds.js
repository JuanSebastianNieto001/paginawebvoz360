/* ==========================================================================
   TRANSICIÓN DE NUBES — portada → Quiénes somos
   Línea de tiempo según el progreso del scroll dentro de .cloud-transition (0–1):
     0.00–0.38  las nubes suben pegadas al borde inferior de la portada
     0.26–0.44  aparece la palabra VOZ360 (letra a letra, la anima CSS)
     0.66–1.00  la palabra sale y las nubes se abren hacia los lados
   Rendimiento: un solo elemento por nube (nube + sombra en el mismo degradado),
   sin filtros de desenfoque y menos nubes en equipos modestos.
   - Con animaciones ligadas al scroll (ScrollTimeline: Chrome, Edge, Android):
     el recorrido de cada nube se calcula una vez y el navegador lo reproduce
     en la GPU al ritmo del scroll, sin JavaScript en cada cuadro. Se recalcula
     solo si cambia el tamaño de la ventana o de la página.
   - Sin ese soporte (p. ej. Safari antiguo): se mueven con JavaScript, solo en
     los cuadros en que el scroll cambió y solo con la sección cerca.
   La palabra VOZ360 la controla siempre JavaScript (solo cambia de clase).
   Estilos: css/sections/clouds.css
   ========================================================================== */
(function () {
  'use strict';

  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var SAMPLES = 60;   // puntos por recorrido con ScrollTimeline (entre ellos se interpola)
  var useTimeline = typeof window.ScrollTimeline === 'function' && typeof Element.prototype.animate === 'function';

  document.querySelectorAll('.cloud-transition').forEach(function (root) {
    var wrap = root.querySelector('.ct-clouds');
    var fog = root.querySelector('.ct-fog');
    var haze = root.querySelector('.ct-haze');
    var word = root.querySelector('.ct-word');

    /* ---------- Nubes: semilla fija para que siempre queden en el mismo lugar ---------- */
    var seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    // Equipos modestos (celular o pocos núcleos): menos nubes y más grandes, mismo efecto
    var lite = window.innerWidth <= 820 || (navigator.hardwareConcurrency || 8) <= 4;
    var rows = lite ? 4 : 5, cols = lite ? 5 : 6;
    var puffs = [];
    var frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var depth = 0.6 + rnd() * 0.9, size = (lite ? 46 : 38) + rnd() * 26;
        var x = (c / (cols - 1)) * 112 - 6 + (rnd() - .5) * 8;   // posición en vw
        var y = (r / (rows - 1)) * 118 - 10 + (rnd() - .5) * 8;  // posición en vh
        var el = document.createElement('div');
        el.className = 'ct-puff';
        el.style.setProperty('--s', size);
        frag.appendChild(el);
        rnd();   // (mantiene la misma secuencia de la semilla)
        puffs.push({ el: el, x: x, y: y, s: size, depth: depth, op: -1 });
      }
    }
    wrap.appendChild(frag);

    /* ---------- Posición de la sección ---------- */
    var top = 0, travel = 1;
    function measure() {
      top = root.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, root.offsetHeight - window.innerHeight);
    }
    var progress = function () { return clamp((window.scrollY - top) / travel); };

    /* ---------- Estado de la escena para un progreso p ---------- */
    function scene(p) {
      var vw = window.innerWidth / 100, vh = window.innerHeight / 100;
      var u = Math.max(vw, vh * .55);                 // misma unidad que --ct-u en CSS
      // El frente de las nubes sigue al borde inferior de la portada: no tapa el
      // titular mientras se ve y no deja huecos cuando la portada sube
      var heroBottom = 100 - p * (travel / vh);       // borde inferior de la portada (en vh)
      var overlap = window.innerWidth <= 640 ? 3 : 10; // en móvil el texto va abajo
      var base = Math.max(0, heroBottom - overlap);
      var rise = 1 - Math.min(1, base / 102);
      var part = ease(clamp((p - 0.66) / 0.34));      // las nubes se abren
      return { vw: vw, vh: vh, u: u, base: base, rise: rise, part: part,
        op: Math.round((1 - part) * 100) / 100,
        fog: (rise * (1 - part) * 0.55).toFixed(3), haze: (rise * (1 - part)).toFixed(3) };
    }
    function puffTransform(q, s) {
      var dir = q.x < 50 ? -1 : 1;
      // + compensación del tamaño de cada nube (su parte visible sobresale hacia arriba)
      var shift = s.base + (12 + (q.s * 0.36 * s.u) / s.vh + q.depth * 8) * (1 - s.rise);
      var spread = s.part * (55 + q.depth * 45) * dir * (.4 + Math.abs(q.x - 50) / 50);
      var lift = -s.part * q.depth * 18, sc = 1 + s.part * q.depth * 1.4;
      var px = (q.x + spread) * s.vw - (q.s * s.u) / 2;
      var py = (q.y + shift + lift) * s.vh - (q.s * .36 * s.u);
      return 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
    }

    /* ---------- Modo 1: animaciones ligadas al scroll (en la GPU) ---------- */
    var anims = [];
    function buildTimeline() {
      anims.forEach(function (a) { a.cancel(); });
      anims = [];
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      // Fracción del scroll total de la página donde empieza (p=0) y termina (p=1) la escena
      var o0 = clamp(top / maxScroll), o1 = clamp((top + travel) / maxScroll);
      if (o1 <= o0) return;
      var timeline = new ScrollTimeline({ source: document.documentElement, axis: 'block' });
      var states = [];
      for (var i = 0; i <= SAMPLES; i++) states.push(scene(i / SAMPLES));
      // Antes y después de la escena se mantienen el primer y el último estado
      var frames = function (fn) {
        var kf = [Object.assign({ offset: 0 }, fn(states[0]))];
        states.forEach(function (s, i) { kf.push(Object.assign({ offset: o0 + (o1 - o0) * i / SAMPLES }, fn(s))); });
        kf.push(Object.assign({ offset: 1 }, fn(states[SAMPLES])));
        return kf;
      };
      var opts = { timeline: timeline, fill: 'both', easing: 'linear' };
      puffs.forEach(function (q) {
        anims.push(q.el.animate(frames(function (s) { return { transform: puffTransform(q, s), opacity: s.op }; }), opts));
      });
      anims.push(fog.animate(frames(function (s) { return { opacity: s.fog }; }), opts));
      anims.push(haze.animate(frames(function (s) { return { opacity: s.haze }; }), opts));
    }

    /* ---------- Modo 2: JavaScript por cuadro (navegadores sin ScrollTimeline) ---------- */
    function drawFrame(p) {
      var s = scene(p);
      for (var i = 0; i < puffs.length; i++) {
        var q = puffs[i];
        q.el.style.transform = puffTransform(q, s);
        if (s.op !== q.op) { q.el.style.opacity = s.op; q.op = s.op; }   // solo si cambió
      }
      fog.style.opacity = s.fog;
      haze.style.opacity = s.haze;
    }

    /* ---------- Palabra VOZ360 ---------- */
    // Con margen (histéresis) para que no parpadee si el scroll se queda justo en
    // el límite. Al volver desde abajo reaparece rápido y completa.
    var wordState = 0;   // 0 oculta · 1 visible · 2 saliendo
    function updateWord(p) {
      if (!word) return;
      var ws = wordState;
      if (p < (ws === 0 ? 0.30 : 0.285)) ws = 0;
      else if (p >= (ws === 2 ? 0.625 : 0.645)) ws = 2;
      else ws = 1;
      if (ws !== wordState) {
        word.classList.toggle('is-back', wordState === 2 && ws === 1);
        word.classList.toggle('is-in', ws === 1);
        word.classList.toggle('is-out', ws === 2);
        wordState = ws;
      }
    }

    /* ---------- Arranque y bucle ---------- */
    var visible = true, lastP = -1, lastW = 0, rebuildQueued = false;
    function refresh() {
      measure();
      lastP = -1;
      if (useTimeline && !rebuildQueued) {
        rebuildQueued = true;
        requestAnimationFrame(function () { rebuildQueued = false; buildTimeline(); });
      }
    }
    refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh);
    if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(document.body);
    if ('IntersectionObserver' in window) {
      // Lejos de la pantalla, la escena no se dibuja (.is-idle → content-visibility en CSS)
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; root.classList.toggle('is-idle', !visible); lastP = -1; }, { rootMargin: '20% 0px' }).observe(root);
    }

    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      // Sin suavizado: la escena usa el progreso real del scroll, así la palabra
      // nunca queda desfasada al subir o bajar rápido
      var p = progress();
      if (p === lastP && window.innerWidth === lastW) return;   // nada cambió
      lastP = p; lastW = window.innerWidth;
      if (!useTimeline) drawFrame(p);
      updateWord(p);
    }
    requestAnimationFrame(frame);
  });
})();
