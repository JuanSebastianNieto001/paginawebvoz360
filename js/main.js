(function () {
  'use strict';

  /* ------------------------------------------------------------
     Formulario: pega aquí la URL de tu servicio de formularios
     (p. ej. Formspree: https://formspree.io/f/xxxxxxx).
     Mientras esté vacío, el formulario no envía datos.
     ------------------------------------------------------------ */
  var FORM_ENDPOINT = '';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     Intro: el video se reproduce cada vez que se entra o recarga.
     Al terminar, tres capas suben en cascada (barrido de cortina)
     y destapan la web. Si el navegador bloquea el autoplay o el
     video falla, la intro se cierra sola para no tapar la página.
     ============================================================ */
  (function intro() {
    var el = document.getElementById('intro');
    if (!el) return;
    var video = el.querySelector('video');
    var closed = false;

    function close() {
      if (closed) return;
      closed = true;
      el.classList.add('is-done');
      // El hero empieza a animarse mientras sube la última capa
      setTimeout(function () { document.documentElement.classList.remove('intro-active'); }, 650);
      setTimeout(function () { el.remove(); }, 1400);
    }

    video.addEventListener('ended', close);
    video.addEventListener('error', close);

    if (video.ended) return close();
    var played = video.play();
    if (played && played.catch) played.catch(close);

    // Tope de seguridad: el video dura ~2 s
    setTimeout(close, 6000);
  })();

  /* ============================================================
     Animaciones al hacer scroll (se repiten cada vez)
     Al entrar en pantalla se añade .is-in; al salir se quita,
     así la animación vuelve a reproducirse en el siguiente paso.
     ============================================================ */
  var revealEls = document.querySelectorAll('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-in', entry.isIntersecting);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ============================================================
     Menú móvil
     ============================================================ */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');

  function closeMenu() {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menú');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ============================================================
     Header: se oculta al bajar. Con mouse reaparece al acercar el
     puntero a la parte superior; en pantallas táctiles, al subir.
     ============================================================ */
  var header = document.getElementById('site-header');
  if (header) {
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var REVEAL_ZONE = 80;   // px desde el borde superior que muestran el header
    var lastY = window.scrollY;
    var pointerNear = false;
    var ticking = false;

    function keyboardFocus() {
      try { return !!header.querySelector(":focus-visible"); } catch (err) { return false; }
    }

    function setHidden(hidden) { header.classList.toggle('is-hidden', hidden); }

    function onScroll() {
      ticking = false;
      var y = window.scrollY;
      var atTop = y < 10;
      header.classList.toggle('is-solid', !atTop);

      if (atTop || nav.classList.contains('is-open') || keyboardFocus()) {
        setHidden(false);
      } else if (canHover) {
        setHidden(!pointerNear);
      } else if (y > lastY + 4) {
        setHidden(true);
      } else if (y < lastY - 4) {
        setHidden(false);
      }
      lastY = y;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });

    if (canHover) {
      document.addEventListener('mousemove', function (e) {
        // Mientras está visible, se mantiene si el puntero sigue sobre el header
        var limit = header.classList.contains('is-hidden') ? REVEAL_ZONE : header.offsetHeight + 24;
        var near = e.clientY <= limit;
        if (near === pointerNear) return;
        pointerNear = near;
        onScroll();
      });
    }

    // Accesibilidad: con teclado, al enfocar un enlace del header se muestra
    header.addEventListener('focusin', function () { if (keyboardFocus()) setHidden(false); });
    header.addEventListener('focusout', function () { setTimeout(onScroll, 0); });
    if (menuBtn) menuBtn.addEventListener('click', onScroll);

    onScroll();
  }

  /* ============================================================
     Efectos de botones: magnético + luz que sigue el cursor +
     onda y pulso al presionar. Solo con puntero fino y sin
     prefers-reduced-motion. No toca el HTML: añade clases.
     ============================================================ */
  (function initButtonEffects() {
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduceMotion || !finePointer) return;

    // Botones de fondo claro: usan la variante oscura del brillo
    var LIGHT = '.btn-white, .arrow, .scard-link';
    var els = document.querySelectorAll('.vz-btn, .arrow, .scard-link');

    els.forEach(function (el) {
      if (el.dataset.fxBound) return;
      el.dataset.fxBound = '1';
      el.classList.add('magnetic', 'btn-glow');
      if (el.matches(LIGHT) && !el.closest('.scard--dark')) el.classList.add('btn-glow-dark');
      var pressed = false;

      function applyTransform(dx, dy) {
        el.style.transform = 'translate(' + (dx * 0.14) + 'px, ' + (dy * 0.22) + 'px) scale(' + (pressed ? 0.96 : 1) + ')';
      }

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        applyTransform(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });

      el.addEventListener('pointerdown', function (e) {
        pressed = true;
        var r = el.getBoundingClientRect();
        applyTransform(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        spawnRipple(el, e, r);
        el.classList.remove('btn-pulse');
        void el.offsetWidth;
        el.classList.add('btn-pulse');
      });

      function release() { pressed = false; el.style.transform = ''; }
      el.addEventListener('pointerup', release);
      el.addEventListener('pointerleave', release);
    });

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

  /* ============================================================
     Carrusel
     ============================================================ */
  var gallery = document.querySelector('.galeria');
  if (gallery) {
    var track = gallery.querySelector('.slider-track');
    var slides = gallery.querySelectorAll('.slide');
    var thumbs = gallery.querySelectorAll('.thumb');
    var progress = gallery.querySelector('.slider-progress div');
    var dotsWrap = gallery.querySelector('.dots');
    var total = slides.length;
    var current = 0;
    var timer = null;
    var visible = false;

    var dots = Array.prototype.map.call(slides, function (slide, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot';
      b.setAttribute('aria-label', slide.querySelector('img').alt);
      b.appendChild(document.createElement('span'));
      b.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i, user) {
      current = (i + total) % total;
      track.style.transform = 'translateX(' + (-100 * current) + '%)';
      progress.style.width = Math.round(((current + 1) / total) * 100) + '%';
      thumbs.forEach(function (t, k) {
        t.classList.toggle('is-active', k === current);
        t.setAttribute('aria-current', k === current ? 'true' : 'false');
      });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === current); });
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', k === current ? 'false' : 'true'); });
      if (user) restart();
    }

    function start() {
      if (reduceMotion || timer || !visible) return;
      timer = setInterval(function () { go(current + 1); }, 4200);
    }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { go(i, true); }); });
    gallery.querySelectorAll('[data-slide="prev"]').forEach(function (b) { b.addEventListener('click', function () { go(current - 1, true); }); });
    gallery.querySelectorAll('[data-slide="next"]').forEach(function (b) { b.addEventListener('click', function () { go(current + 1, true); }); });

    // Deslizar con el dedo
    var startX = null;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1), true);
      startX = null;
    });

    var slider = gallery.querySelector('.slider');
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);

    // Solo avanza mientras el carrusel está en pantalla
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(gallery);
    } else {
      visible = true;
      start();
    }

    go(0);
  }

  /* ============================================================
     Preguntas frecuentes (acordeón)
     ============================================================ */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-sign').textContent = '+';
      });
      if (willOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        item.querySelector('.faq-sign').textContent = '–';
      }
    });
  });

  /* ============================================================
     Formulario de contacto
     ============================================================ */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var submit = form.querySelector('.form-submit');

    function setStatus(msg, type) {
      status.textContent = msg;
      status.className = 'form-status' + (type ? ' is-' + type : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        var firstInvalid = form.querySelector(':invalid');
        setStatus('Revisa los campos obligatorios: nombre, correo y mensaje.', 'error');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!FORM_ENDPOINT) {
        setStatus('El formulario aún no está conectado. Mientras tanto, escríbenos por Instagram: @voz360_contact_center.', 'error');
        return;
      }

      submit.disabled = true;
      setStatus('Enviando…');

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        setStatus('¡Gracias! Recibimos tu solicitud y te contactaremos pronto.', 'ok');
      }).catch(function () {
        setStatus('No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.', 'error');
      }).then(function () {
        submit.disabled = false;
      });
    });
  }

  /* Año del footer */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
