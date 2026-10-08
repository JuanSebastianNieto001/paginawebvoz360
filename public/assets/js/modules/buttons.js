/* ==========================================================================
   EFECTOS DE BOTONES — magnético, luz que sigue el cursor, onda y pulso
   Solo con puntero fino (mouse): en pantallas táctiles no se activan.
   No modifica el HTML; añade las clases .magnetic y .btn-glow.
   Estilos: css/components/buttons.css
   ========================================================================== */
(function () {
  'use strict';

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var SELECTOR = '.vz-btn, .gallery-prev, .gallery-next';

  document.querySelectorAll(SELECTOR).forEach(function (el) {
    el.classList.add('magnetic', 'btn-glow');
    var pressed = false;
    var rect = null;            // caja sin desplazar: se mide al entrar el puntero y se reutiliza
    var tx = 0, ty = 0;         // desplazamiento que se aplicó por última vez

    // Mide una sola vez por entrada (medir en cada pointermove, justo después de escribir
    // transform, obliga a recalcular el layout). El centro no cambia con el scale de :hover
    // y el tamaño sale de offsetWidth/offsetHeight, que no incluyen transform.
    function measure() {
      var r = el.getBoundingClientRect();
      var w = el.offsetWidth, h = el.offsetHeight;
      var cx = r.left + r.width / 2 - tx, cy = r.top + r.height / 2 - ty;   // sin el desplazamiento aplicado
      rect = { left: cx - w / 2, top: cy - h / 2, width: w, height: h, cx: cx, cy: cy };
      return rect;
    }
    function invalidate() { rect = null; }   // la página se desplazó con el puntero encima

    // El botón se desplaza un poco hacia el cursor (más en vertical que en horizontal)
    function applyTransform(e) {
      var r = rect || measure();
      tx = (e.clientX - r.cx) * 0.14;
      ty = (e.clientY - r.cy) * 0.22;
      el.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + (pressed ? 0.96 : 1) + ')';
      return r;
    }

    el.addEventListener('pointerenter', function () {
      measure();
      window.addEventListener('scroll', invalidate, { passive: true });
    });

    el.addEventListener('pointermove', function (e) {
      var r = applyTransform(e);
      el.style.setProperty('--mx', (e.clientX - r.left - tx) + 'px');   // posición de la luz
      el.style.setProperty('--my', (e.clientY - r.top - ty) + 'px');
    });

    el.addEventListener('pointerdown', function (e) {
      pressed = true;
      var r = applyTransform(e);
      spawnRipple(el, e, { left: r.left + tx, top: r.top + ty, width: r.width, height: r.height });
      el.classList.remove('btn-pulse');
      void el.offsetWidth;                    // reinicia la animación del pulso
      el.classList.add('btn-pulse');
    });

    function release() { pressed = false; tx = ty = 0; el.style.transform = ''; }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', function () {
      release();
      rect = null;
      window.removeEventListener('scroll', invalidate);
    });
  });

  // Onda de color que nace donde se hizo clic
  function spawnRipple(el, e, rect) {
    var size = Math.max(rect.width, rect.height) * 2.2;
    var ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', function () { ripple.remove(); });
  }
})();
