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
  // [data-animate]: secciones que animan a sus hijos desde CSS con .is-in
  var revealEls = document.querySelectorAll('[data-reveal], [data-animate]');

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
     Transición de nubes entre la portada y Quiénes somos.
     Con el scroll las nubes suben, cubren la pantalla y se abren.
     ============================================================ */
  if (!reduceMotion) {
    document.querySelectorAll('.cloud-transition').forEach(function (root) {
      var cl = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
      var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
      var wrap = root.querySelector('.ct-clouds');
      var fog = root.querySelector('.ct-fog');
      var haze = root.querySelector('.ct-haze');
      var word = root.querySelector('.ct-word');
      var letters = word ? word.querySelectorAll('.ct-logo span') : [];
      var tag = word ? word.querySelector('.ct-tag') : null;

      // Semilla fija: las nubes siempre quedan en la misma posición
      var seed = 7;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      var puffs = [], rows = 7, cols = 9;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var depth = 0.6 + rnd() * 0.9, size = 26 + rnd() * 26;
          var x = (c / (cols - 1)) * 112 - 6 + (rnd() - .5) * 8;
          var y = (r / (rows - 1)) * 118 - 10 + (rnd() - .5) * 8;
          [true, false].forEach(function (sh) {
            var el = document.createElement('div');
            el.className = 'ct-puff' + (sh ? ' sh' : '');
            var s = sh ? size * 1.1 : size;
            el.style.setProperty('--s', s);
            wrap.appendChild(el);
            puffs.push({ el: el, x: x, y: y + (sh ? 4 : 0), s: s, depth: depth, ph: rnd() * 6.28, sh: sh });
          });
        }
      }

      var target = 0, cur = 0, visible = true;
      var progress = function () {
        var b = root.getBoundingClientRect();
        return cl(-b.top / (b.height - window.innerHeight));
      };
      window.addEventListener('scroll', function () { target = progress(); }, { passive: true });
      window.addEventListener('resize', function () { target = progress(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: '20% 0px' }).observe(root);
      }
      target = cur = progress();

      function frame(t) {
        requestAnimationFrame(frame);
        if (!visible) return;
        cur += (target - cur) * 0.12;
        var p = cur, time = t / 1000, vw = window.innerWidth / 100, vh = window.innerHeight / 100;
        var u = Math.max(vw, vh * .55);             // misma unidad que --ct-u en CSS
        // Línea de tiempo: suben con la portada (0–0.38) · VOZ360 entra (0.26–0.44) · pausa · sale y se abren (0.66–1)
        // El frente de las nubes sigue al borde inferior de la portada: no tapan el
        // título mientras se ve y tampoco dejan huecos cuando la portada sube
        var travelVh = (root.offsetHeight - window.innerHeight) / vh;
        var heroBottom = 100 - target * travelVh;           // borde inferior de la portada (vh), sin suavizado para no quedarse atrás
        // El frente se monta un poco sobre el borde, sin llegar al texto (en móvil el texto va abajo)
        var overlap = window.innerWidth <= 640 ? 3 : 10;
        var base = Math.max(0, heroBottom - overlap);
        var rise = 1 - Math.min(1, base / 102);
        var part = ease(cl((p - 0.66) / 0.34));     // las nubes se abren
        for (var i = 0; i < puffs.length; i++) {
          var q = puffs[i];
          var drift = Math.sin(time * .25 + q.ph) * 1.6, dir = q.x < 50 ? -1 : 1;
          // + compensación del tamaño de cada nube (su parte visible sobresale hacia arriba) mientras suben
          var shift = base + (12 + (q.s * 0.36 * u) / vh + q.depth * 8) * (1 - rise);
          var spread = part * (55 + q.depth * 45) * dir * (.4 + Math.abs(q.x - 50) / 50);
          var lift = -part * q.depth * 18, sc = 1 + part * q.depth * 1.4;
          var px = (q.x + drift + spread) * vw - (q.s * u) / 2;
          var py = (q.y + shift + lift) * vh - (q.s * .36 * u);
          q.el.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0) scale(' + sc + ')';
          q.el.style.opacity = (1 - part) * (q.sh ? .9 : 1);
        }
        fog.style.opacity = (rise * (1 - part) * 0.55).toFixed(3);
        haze.style.opacity = (rise * (1 - part)).toFixed(3);   // desenfoque "de sueño" del fondo

        // Palabra VOZ360: las letras entran una a una y luego crecen y se desvanecen
        if (word) {
          var wIn = cl((p - 0.26) / 0.18);
          var wOut = ease(cl((p - 0.64) / 0.16));
          word.style.opacity = (wIn > 0 ? 1 : 0) * (1 - wOut);
          word.style.transform = 'scale(' + (1 + wOut * 0.5).toFixed(3) + ')';
          for (var k = 0; k < letters.length; k++) {
            var li = ease(cl(wIn * 1.8 - k * 0.16));
            letters[k].style.opacity = li.toFixed(3);
            letters[k].style.transform = 'translateY(' + ((1 - li) * 60).toFixed(1) + 'px) rotate(' + ((1 - li) * 8).toFixed(1) + 'deg)';
            letters[k].style.filter = 'blur(' + ((1 - li) * 12).toFixed(1) + 'px)';
          }
          if (tag) {
            var ti = ease(cl((wIn - 0.55) / 0.45));
            tag.style.opacity = ti.toFixed(3);
            tag.style.transform = 'translateY(' + ((1 - ti) * 14).toFixed(1) + 'px)';
            tag.style.letterSpacing = (0.42 + (1 - ti) * 0.3).toFixed(3) + 'em';
          }
        }
      }
      requestAnimationFrame(frame);
    });
  }

  /* ============================================================
     Quiénes somos: ecualizador de la llamada y cronómetro en vivo
     ============================================================ */
  var qsWave = document.getElementById('qs-wave');
  if (qsWave) {
    for (var b = 0; b < 28; b++) {
      var bar = document.createElement('i');
      bar.style.animationDelay = (-Math.random() * 1.1).toFixed(2) + 's';
      bar.style.animationDuration = (0.7 + Math.random() * 0.8).toFixed(2) + 's';
      qsWave.appendChild(bar);
    }
  }
  var qsTimer = document.getElementById('qs-timer');
  if (qsTimer) {
    var qsSeconds = 134;
    setInterval(function () {
      qsSeconds++;
      qsTimer.textContent = String(Math.floor(qsSeconds / 60)).padStart(2, '0') + ':' + String(qsSeconds % 60).padStart(2, '0');
    }, 1000);
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
