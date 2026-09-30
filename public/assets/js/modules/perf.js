/* ==========================================================================
   RENDIMIENTO Y DETALLES GLOBALES
   - Las secciones que no están en pantalla reciben .is-offscreen y sus
     animaciones CSS infinitas se pausan (css/base/base.css). Se reanudan
     150 px antes de volver a entrar.
   - Año actual en el footer.
   ========================================================================== */
(function () {
  'use strict';

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-offscreen', !e.isIntersecting); });
    }, { rootMargin: '150px 0px' });
    document.querySelectorAll('.hero, main > section, .footer').forEach(function (el) { observer.observe(el); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
