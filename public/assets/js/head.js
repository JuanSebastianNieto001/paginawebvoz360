/* ==========================================================================
   HEAD — se carga en el <head> SIN defer (antes de pintar la página)
   - La página siempre empieza desde arriba al entrar o recargar.
   - Marca <html> con .js (activa las animaciones de entrada) e .intro-active
     (bloquea el scroll mientras se ve la intro).
   - Tope de seguridad: si modules/intro.js no llegara a cerrar la intro, se
     cierra sola a los 8 s para no dejar la página tapada.
   Va en un archivo aparte (no en línea) para que la Content-Security-Policy
   pueda prohibir scripts en línea (script-src 'self').
   ========================================================================== */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
window.scrollTo(0, 0);
window.addEventListener('pageshow', function () { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); });

document.documentElement.classList.add('js', 'intro-active');
setTimeout(function () {
  var intro = document.getElementById('intro');
  if (intro) intro.classList.add('is-done');
  document.documentElement.classList.remove('intro-active');
}, 8000);
