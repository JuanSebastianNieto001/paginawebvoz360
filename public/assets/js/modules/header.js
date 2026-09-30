/* ==========================================================================
   HEADER Y MENÚ MÓVIL
   - Menú móvil (≤ 960 px): botón hamburguesa que abre/cierra la navegación.
   - Header: se vuelve sólido al bajar y se oculta. Con mouse reaparece al
     acercar el puntero a la parte superior; en pantallas táctiles, al subir.
   - Accesibilidad: con teclado, al enfocar un enlace del header se muestra.
   Estilos: css/layout/header.css
   ========================================================================== */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var nav = document.getElementById('nav');
  var menuBtn = document.querySelector('.menu-btn');
  if (!header || !nav) return;

  /* ---------- Menú móvil ---------- */
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    if (!menuBtn) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Header que se oculta ---------- */
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var REVEAL_ZONE = 80;   // px desde el borde superior que vuelven a mostrar el header
  var lastY = window.scrollY;
  var pointerNear = false;
  var ticking = false;

  function keyboardFocus() {
    try { return !!header.querySelector(':focus-visible'); } catch (err) { return false; }
  }
  function setHidden(hidden) { header.classList.toggle('is-hidden', hidden); }

  function update() {
    ticking = false;
    var y = window.scrollY;
    var atTop = y < 10;
    header.classList.toggle('is-solid', !atTop);

    if (atTop || nav.classList.contains('is-open') || keyboardFocus()) setHidden(false);
    else if (canHover) setHidden(!pointerNear);
    else if (y > lastY + 4) setHidden(true);    // táctil: bajando
    else if (y < lastY - 4) setHidden(false);   // táctil: subiendo
    lastY = y;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  if (canHover) {
    document.addEventListener('mousemove', function (e) {
      // Mientras está visible, se mantiene si el puntero sigue sobre el header
      var limit = header.classList.contains('is-hidden') ? REVEAL_ZONE : header.offsetHeight + 24;
      var near = e.clientY <= limit;
      if (near === pointerNear) return;
      pointerNear = near;
      update();
    });
  }

  header.addEventListener('focusin', function () { if (keyboardFocus()) setHidden(false); });
  header.addEventListener('focusout', function () { setTimeout(update, 0); });
  if (menuBtn) menuBtn.addEventListener('click', update);

  update();
})();
