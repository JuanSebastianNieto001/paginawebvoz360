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

    // El botón se desplaza un poco hacia el cursor (más en vertical que en horizontal)
    function applyTransform(e) {
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = 'translate(' + (dx * 0.14) + 'px, ' + (dy * 0.22) + 'px) scale(' + (pressed ? 0.96 : 1) + ')';
      return r;
    }

    el.addEventListener('pointermove', function (e) {
      var r = applyTransform(e);
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');   // posición de la luz
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });

    el.addEventListener('pointerdown', function (e) {
      pressed = true;
      spawnRipple(el, e, applyTransform(e));
      el.classList.remove('btn-pulse');
      void el.offsetWidth;                    // reinicia la animación del pulso
      el.classList.add('btn-pulse');
    });

    function release() { pressed = false; el.style.transform = ''; }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
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
