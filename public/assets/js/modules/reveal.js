/* ==========================================================================
   ENTRADA AL HACER SCROLL
   [data-reveal]  → el elemento entra con la animación definida en CSS.
   [data-animate] → la sección anima a sus hijos desde CSS con .is-in.
   La clase .is-in se añade al entrar en pantalla y se quita al salir, así la
   animación se repite cada vez. Estilos: css/base/animations.css
   ========================================================================== */
(function () {
  'use strict';

  var els = document.querySelectorAll('[data-reveal], [data-animate]');

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { entry.target.classList.toggle('is-in', entry.isIntersecting); });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  els.forEach(function (el) { observer.observe(el); });
})();
