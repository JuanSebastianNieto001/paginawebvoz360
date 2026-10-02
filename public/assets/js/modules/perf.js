/* ==========================================================================
   RENDIMIENTO Y DETALLES GLOBALES
   - Las secciones que no están en pantalla reciben .is-offscreen y sus
     animaciones CSS se quitan (css/base/base.css) y vuelven a empezar
     150 px antes de entrar (así no se acumula trabajo al aparecer).
   - La montaña (#vzf) es muy alta y empieza justo después de Instagram: además
     recibe .is-asleep (margen 0), así sus animaciones solo corren cuando de
     verdad se ve; su escena se prepara 150 px antes (.is-offscreen).
   - Año actual en el footer.
   ========================================================================== */
(function () {
  'use strict';

  if ('IntersectionObserver' in window) {
    var toggler = function (cls) {
      return function (entries) { entries.forEach(function (e) { e.target.classList.toggle(cls, !e.isIntersecting); }); };
    };
    var near = new IntersectionObserver(toggler('is-offscreen'), { rootMargin: '150px 0px' });
    document.querySelectorAll('.hero, main > section, .footer').forEach(function (el) { near.observe(el); });
    var vzf = document.getElementById('vzf');
    if (vzf) new IntersectionObserver(toggler('is-asleep')).observe(vzf);
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
