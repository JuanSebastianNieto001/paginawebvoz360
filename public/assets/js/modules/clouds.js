/* ==========================================================================
   TRANSICIÓN DE NUBES — portada → Quiénes somos
   Línea de tiempo según el progreso del scroll dentro de .cloud-transition (0–1):
     0.00–0.38  las nubes suben pegadas al borde inferior de la portada
     0.26–0.44  aparece la palabra VOZ360 (letra a letra, la anima CSS)
     0.66–1.00  la palabra sale y las nubes se abren hacia los lados
   Rendimiento: un solo elemento por nube (nube + sombra en el mismo degradado),
   sin filtros de desenfoque, menos nubes en equipos modestos y un único
   cálculo por cuadro (solo mientras la sección está cerca de la pantalla).
   Estilos: css/sections/clouds.css
   ========================================================================== */
(function () {
  'use strict';

  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

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
    var rows = lite ? 5 : 6, cols = lite ? 6 : 8;
    var puffs = [];
    var frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var depth = 0.6 + rnd() * 0.9, size = (lite ? 36 : 30) + rnd() * 26;
        var x = (c / (cols - 1)) * 112 - 6 + (rnd() - .5) * 8;   // posición en vw
        var y = (r / (rows - 1)) * 118 - 10 + (rnd() - .5) * 8;  // posición en vh
        var el = document.createElement('div');
        el.className = 'ct-puff';
        el.style.setProperty('--s', size);
        frag.appendChild(el);
        puffs.push({ el: el, x: x, y: y, s: size, depth: depth, ph: rnd() * 6.28, op: -1 });
      }
    }
    wrap.appendChild(frag);

    /* ---------- Progreso del scroll ---------- */
    var visible = true, wordState = 0;   // wordState: 0 oculta · 1 visible · 2 saliendo
    var progress = function () {
      var b = root.getBoundingClientRect();
      return clamp(-b.top / (b.height - window.innerHeight));
    };
    var travel = root.offsetHeight - window.innerHeight;
    window.addEventListener('resize', function () { travel = root.offsetHeight - window.innerHeight; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: '20% 0px' }).observe(root);
    }

    function frame(t) {
      requestAnimationFrame(frame);
      if (!visible) return;
      // Sin suavizado: nubes, niebla y VOZ360 usan el progreso real del scroll,
      // así la palabra nunca queda desfasada al subir o bajar rápido
      var p = progress(), time = t / 1000, vw = window.innerWidth / 100, vh = window.innerHeight / 100;
      var u = Math.max(vw, vh * .55);                 // misma unidad que --ct-u en CSS
      // El frente de las nubes sigue al borde inferior de la portada: no tapa el
      // titular mientras se ve y no deja huecos cuando la portada sube
      var heroBottom = 100 - p * (travel / vh);       // borde inferior de la portada (en vh)
      var overlap = window.innerWidth <= 640 ? 3 : 10; // en móvil el texto va abajo
      var base = Math.max(0, heroBottom - overlap);
      var rise = 1 - Math.min(1, base / 102);
      var part = ease(clamp((p - 0.66) / 0.34));      // las nubes se abren
      var op = Math.round((1 - part) * 100) / 100;

      for (var i = 0; i < puffs.length; i++) {
        var q = puffs[i];
        var drift = Math.sin(time * .25 + q.ph) * 1.6, dir = q.x < 50 ? -1 : 1;
        // + compensación del tamaño de cada nube (su parte visible sobresale hacia arriba)
        var shift = base + (12 + (q.s * 0.36 * u) / vh + q.depth * 8) * (1 - rise);
        var spread = part * (55 + q.depth * 45) * dir * (.4 + Math.abs(q.x - 50) / 50);
        var lift = -part * q.depth * 18, sc = 1 + part * q.depth * 1.4;
        var px = (q.x + drift + spread) * vw - (q.s * u) / 2;
        var py = (q.y + shift + lift) * vh - (q.s * .36 * u);
        q.el.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
        if (op !== q.op) { q.el.style.opacity = op; q.op = op; }   // solo si cambió
      }
      fog.style.opacity = (rise * (1 - part) * 0.55).toFixed(3);
      haze.style.opacity = (rise * (1 - part)).toFixed(3);

      // Palabra VOZ360 con margen (histéresis) para que no parpadee si el scroll se
      // queda justo en el límite. Al volver desde abajo reaparece rápido y completa.
      if (word) {
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
    }
    requestAnimationFrame(frame);
  });
})();
