/* ==========================================================================
   INTRO — video del logo al entrar o recargar
   Al terminar el video, tres capas suben en cascada (barrido de cortina) y
   destapan la página. Si el navegador bloquea la reproducción automática o el
   video falla, la intro se cierra sola para no tapar el contenido.
   Estilos: css/sections/intro.css
   ========================================================================== */
(function () {
  'use strict';

  var intro = document.getElementById('intro');
  if (!intro) return;
  var video = intro.querySelector('video');
  var closed = false;

  function close() {
    if (closed) return;
    closed = true;
    intro.classList.add('is-done');
    // La portada empieza a animarse mientras sube la última capa
    setTimeout(function () { document.documentElement.classList.remove('intro-active'); }, 650);
    setTimeout(function () { intro.remove(); }, 1400);
  }

  video.addEventListener('ended', close);
  video.addEventListener('error', close);

  if (video.ended) return close();
  var played = video.play();
  if (played && played.catch) played.catch(close);

  setTimeout(close, 6000);   // tope de seguridad: el video dura ~2 s
})();
