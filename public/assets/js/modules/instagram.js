/* ==========================================================================
   INSTAGRAM — los reels en video se reproducen solo mientras se ven
   (ahorra batería y datos). Estilos: css/sections/instagram.css
   ========================================================================== */
(function () {
  'use strict';

  var videos = document.querySelectorAll('#instagram video');
  if (!videos.length || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var p = e.target.play();
        if (p && p.catch) p.catch(function () {});   // el navegador puede bloquear la reproducción
      } else {
        e.target.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach(function (v) { observer.observe(v); });
})();
