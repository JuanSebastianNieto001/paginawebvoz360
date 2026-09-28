(function () {
  'use strict';

  /* ------------------------------------------------------------
     Formulario: pega aquí la URL de tu servicio de formularios
     (p. ej. Formspree: https://formspree.io/f/xxxxxxx).
     Mientras esté vacío, el formulario no envía datos.
     ------------------------------------------------------------ */
  var FORM_ENDPOINT = '';   // Contáctanos
  var JOBS_ENDPOINT = '';   // Trabaja con nosotros (postulaciones)

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
      window.addEventListener('scroll', function () { target = progress(); if (visible) frame(performance.now(), true); }, { passive: true });
      window.addEventListener('resize', function () { target = progress(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: '20% 0px' }).observe(root);
      }
      target = cur = progress();

      function frame(t, once) {
        if (!once) requestAnimationFrame(frame);
        if (!visible) return;
        // Sin suavizado: nubes, niebla y VOZ360 usan el mismo progreso real del scroll,
        // así la palabra nunca queda desfasada al subir o bajar rápido
        cur = target;
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

        // Palabra VOZ360: se activa al cruzar un punto del recorrido y la animación
        // (letras una a una) la completa CSS sola; así nunca queda a medio formar
        if (word) {
          var wordOut = p >= 0.64;
          var wordIn = p >= 0.30 && !wordOut;
          if (word.classList.contains('is-in') !== wordIn) word.classList.toggle('is-in', wordIn);
          if (word.classList.contains('is-out') !== wordOut) word.classList.toggle('is-out', wordOut);
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
    var LIGHT = '.btn-white, .scard-link';
    var els = document.querySelectorAll('.vz-btn, .scard-link, .gallery-prev, .gallery-next');

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
     Galería: carrusel centrado (basado en Componente_Carrusel).
     Versión sin GSAP: las transiciones las hace CSS. La tarjeta
     activa queda grande al centro y las laterales se achican.
     ============================================================ */
  var gallery = document.getElementById('galeria');
  if (gallery) {
    var gTrack = gallery.querySelector('.gallery-track');
    var gOuter = gallery.querySelector('.gallery-track-outer');
    var gItems = Array.prototype.slice.call(gallery.querySelectorAll('.gallery-item'));
    var gCounter = gallery.querySelector('.gallery-counter');
    var gDotsWrap = gallery.querySelector('.gallery-dots');
    var gBgLayers = gallery.querySelectorAll('.gallery-bg span');
    var gBgIndex = 0;
    var gCurrent = 0;
    var gTimer = null;
    var gVisible = false;
    var G_GAP = 16;
    var G_AUTOPLAY = 2000;   // cambia de foto cada 2 segundos
    var pad2 = function (n) { return String(n).padStart(2, '0'); };

    var gDots = gItems.map(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gallery-dot';
      b.setAttribute('aria-label', 'Ir a la foto ' + (i + 1) + ': ' + item.querySelector('figcaption').textContent);
      b.appendChild(document.createElement('span'));
      b.addEventListener('click', function () { gGo(i, true); });
      gDotsWrap.appendChild(b);
      return b;
    });

    // Tamaños según distancia a la activa (relativos al alto disponible)
    function gSizes() {
      var vw = gOuter.clientWidth;
      var h = Math.max(180, gOuter.clientHeight);
      var mobile = vw <= 768;
      return [
        { w: mobile ? vw * 0.78 : Math.min(vw * 0.38, 560), h: h, o: 1 },
        { w: mobile ? vw * 0.16 : Math.min(vw * 0.18, 260), h: h * 0.74, o: 0.55 },
        { w: mobile ? vw * 0.10 : Math.min(vw * 0.12, 180), h: h * 0.56, o: 0.28 },
        { w: mobile ? vw * 0.05 : Math.min(vw * 0.08, 120), h: h * 0.4, o: 0.12 }
      ];
    }

    function gSetBg(i) {
      var img = gItems[i].querySelector('img');
      var next = gBgLayers[1 - gBgIndex];
      next.style.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")';
      next.classList.add('is-on');
      gBgLayers[gBgIndex].classList.remove('is-on');
      gBgIndex = 1 - gBgIndex;
    }

    function gGo(index, user, instant) {
      gCurrent = (index + gItems.length) % gItems.length;
      var s = gSizes();
      if (instant) gallery.classList.add('no-anim');
      var widths = gItems.map(function (_, i) { return s[Math.min(3, Math.abs(i - gCurrent))].w; });
      var left = 0;
      for (var i = 0; i < gCurrent; i++) left += widths[i] + G_GAP;
      gTrack.style.transform = 'translateX(' + (gOuter.clientWidth / 2 - (left + widths[gCurrent] / 2)) + 'px)';
      gItems.forEach(function (item, k) {
        var cfg = s[Math.min(3, Math.abs(k - gCurrent))];
        item.style.width = cfg.w + 'px';
        item.style.height = cfg.h + 'px';
        item.style.opacity = cfg.o;
        item.classList.toggle('is-active', k === gCurrent);
        item.setAttribute('aria-hidden', k === gCurrent ? 'false' : 'true');
      });
      gDots.forEach(function (d, k) { d.classList.toggle('is-active', k === gCurrent); });
      gCounter.textContent = pad2(gCurrent + 1) + ' / ' + pad2(gItems.length);
      gSetBg(gCurrent);
      if (instant) { void gTrack.offsetWidth; gallery.classList.remove('no-anim'); }
      if (user) gRestart();
    }

    function gStart() {
      if (reduceMotion || gTimer || !gVisible) return;
      gTimer = setInterval(function () { gGo(gCurrent + 1); }, G_AUTOPLAY);
    }
    function gStop() { clearInterval(gTimer); gTimer = null; }
    function gRestart() { gStop(); gStart(); }

    gallery.querySelector('.gallery-prev').addEventListener('click', function () { gGo(gCurrent - 1, true); });
    gallery.querySelector('.gallery-next').addEventListener('click', function () { gGo(gCurrent + 1, true); });
    gItems.forEach(function (item, i) {
      item.addEventListener('click', function () { if (!gDragged && i !== gCurrent) gGo(i, true); });
    });

    // Arrastrar con el mouse o deslizar con el dedo
    var gStartX = null, gDragged = false;
    gOuter.addEventListener('pointerdown', function (e) { gStartX = e.clientX; gDragged = false; });
    window.addEventListener('pointerup', function (e) {
      if (gStartX === null) return;
      var dx = e.clientX - gStartX;
      gStartX = null;
      if (Math.abs(dx) > 40) { gDragged = true; gGo(gCurrent + (dx < 0 ? 1 : -1), true); setTimeout(function () { gDragged = false; }, 0); }
    });

    // Teclado: flechas, solo mientras la galería está en pantalla
    document.addEventListener('keydown', function (e) {
      if (!gVisible || (e.target.closest && e.target.closest('input, textarea, .bot-panel'))) return;
      if (e.key === 'ArrowLeft') gGo(gCurrent - 1, true);
      if (e.key === 'ArrowRight') gGo(gCurrent + 1, true);
    });


    // Solo avanza sola mientras está en pantalla
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        gVisible = entries[0].isIntersecting;
        gVisible ? gStart() : gStop();
      }, { threshold: 0.35 }).observe(gallery);
    } else { gVisible = true; }

    window.addEventListener('resize', function () { requestAnimationFrame(function () { gGo(gCurrent, false, true); }); });
    requestAnimationFrame(function () { gGo(0, false, true); gStart(); });
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
     Bot Voz360: botón flotante con dos opciones, "Contáctanos" y
     "Trabaja con nosotros"; cada una despliega su formulario.
     Los enlaces a #contacto y #trabaja abren el bot en esa opción.
     ============================================================ */
  var bot = document.getElementById('bot');
  var openBot = function () {};
  if (bot) {
    var botPanel = bot.querySelector('.bot-panel');
    var botBody = bot.querySelector('.bot-body');
    var botLauncher = bot.querySelector('.bot-launcher');
    var botSteps = bot.querySelectorAll('.bot-body > .bot-msg, .bot-body > .bot-options');
    var botOpts = bot.querySelectorAll('.bot-opt');
    var botTimers = [];
    var botReturnFocus = null;

    function clearBotTimers() { botTimers.forEach(clearTimeout); botTimers = []; }

    // Muestra el formulario de la opción elegida y oculta el otro
    function showFlow(name) {
      botOpts.forEach(function (b) {
        var on = b.getAttribute('data-flow') === name;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-expanded', String(on));
        document.getElementById('flow-' + b.getAttribute('data-flow')).hidden = !on;
      });
      var flow = document.getElementById('flow-' + name);
      if (!flow) return;
      setTimeout(function () {
        botBody.scrollTo({ top: flow.offsetTop - 12, behavior: reduceMotion ? 'auto' : 'smooth' });
        var first = flow.querySelector('input, select, textarea');
        if (first && window.matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
      }, 80);
    }
    function resetFlows() {
      botOpts.forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-expanded', 'false');
        document.getElementById('flow-' + b.getAttribute('data-flow')).hidden = true;
      });
    }
    botOpts.forEach(function (b) {
      b.addEventListener('click', function () { showFlow(b.getAttribute('data-flow')); });
    });

    // Bot Voz360 "escribe" y los mensajes aparecen uno tras otro
    function playBotIntro(done) {
      clearBotTimers();
      botSteps.forEach(function (el) { el.classList.remove('is-shown'); });
      if (reduceMotion) { botSteps.forEach(function (el) { el.classList.add('is-shown'); }); if (done) done(); return; }
      var t = 0;
      botSteps.forEach(function (el) {
        var isMsg = el.classList.contains('bot-msg') && !el.classList.contains('bot-msg--info');
        if (isMsg) {
          botTimers.push(setTimeout(function () { bot.classList.add('is-typing'); }, t));
          t += 650;
        }
        botTimers.push(setTimeout(function () { bot.classList.remove('is-typing'); el.classList.add('is-shown'); }, t));
        t += isMsg ? 250 : 180;
      });
      if (done) botTimers.push(setTimeout(done, t));
    }

    openBot = function (flow) {
      if (bot.classList.contains('is-open')) { if (flow) showFlow(flow); return; }
      botReturnFocus = document.activeElement;
      bot.classList.remove('show-hint');
      bot.classList.add('is-open');
      botPanel.setAttribute('aria-hidden', 'false');
      botLauncher.setAttribute('aria-expanded', 'true');
      botLauncher.setAttribute('aria-label', 'Cerrar chat con Bot Voz360');
      if (window.matchMedia('(max-width: 640px)').matches) document.documentElement.style.overflow = 'hidden';
      resetFlows();
      botBody.scrollTop = 0;
      playBotIntro(flow ? function () { showFlow(flow); } : null);
      setTimeout(function () { bot.querySelector('.bot-close').focus({ preventScroll: true }); }, 60);
    };

    function closeBot() {
      if (!bot.classList.contains('is-open')) return;
      clearBotTimers();
      bot.classList.remove('is-open', 'is-typing');
      botPanel.setAttribute('aria-hidden', 'true');
      botLauncher.setAttribute('aria-expanded', 'false');
      botLauncher.setAttribute('aria-label', 'Abrir chat con Bot Voz360');
      document.documentElement.style.overflow = '';
      if (botReturnFocus && botReturnFocus.focus) botReturnFocus.focus({ preventScroll: true });
    }

    botLauncher.addEventListener('click', function () {
      bot.classList.contains('is-open') ? closeBot() : openBot();
    });
    bot.querySelector('.bot-close').addEventListener('click', closeBot);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBot(); });

    // Clic fuera del panel lo cierra (en escritorio)
    var BOT_LINKS = 'a[href="#contacto"], a[href="#trabaja"]';
    document.addEventListener('pointerdown', function (e) {
      if (bot.classList.contains('is-open') && !bot.contains(e.target) && !e.target.closest(BOT_LINKS)) closeBot();
    });

    // "Hablemos", "Solicitar propuesta"… abren Contáctanos; "Trabaja con nosotros" abre la postulación
    document.querySelectorAll(BOT_LINKS).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openBot(a.getAttribute('href') === '#trabaja' ? 'trabaja' : 'contacto');
      });
    });

    // Burbuja "¿Hablamos?": aparece, se queda un ratico, se va y vuelve
    // a salir 4 segundos después. Se pausa mientras el chat está abierto.
    var HINT_VISIBLE = 2600, HINT_GAP = 4000;
    (function hintLoop() {
      var wait = document.documentElement.classList.contains('intro-active') ? 1000 : HINT_GAP;
      setTimeout(function () {
        if (bot.classList.contains('is-open') || document.documentElement.classList.contains('intro-active')) return hintLoop();
        bot.classList.add('show-hint');
        setTimeout(function () { bot.classList.remove('show-hint'); hintLoop(); }, HINT_VISIBLE);
      }, wait);
    })();
  }

  /* ============================================================
     Formulario de postulación: fechas, WhatsApp y validaciones
     ============================================================ */
  var jobForm = document.getElementById('job-form');
  if (jobForm) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var today = new Date();
    var todayIso = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());

    // Calendario nativo; se guarda y se muestra como día/mes/año
    jobForm.querySelectorAll('input[type="date"]').forEach(function (inp) {
      inp.max = todayIso;
      var hidden = document.getElementById(inp.getAttribute('data-date-for'));
      var hint = jobForm.querySelector('[data-hint-for="' + inp.id + '"]');
      inp.addEventListener('change', function () {
        if (!inp.value) { hidden.value = ''; hint.textContent = 'Día / mes / año'; hint.classList.remove('is-set'); return; }
        var p = inp.value.split('-');                       // aaaa-mm-dd
        hidden.value = p[2] + '/' + p[1] + '/' + p[0];      // dd/mm/aaaa
        hint.textContent = 'Seleccionaste: ' + hidden.value;
        hint.classList.add('is-set');
        checkDates();
      });
    });

    // La expedición del documento no puede ser anterior al nacimiento
    var nac = document.getElementById('j-nac');
    var exp = document.getElementById('j-exp');
    function checkDates() {
      exp.setCustomValidity(nac.value && exp.value && exp.value <= nac.value ? 'La fecha de expedición debe ser posterior a la de nacimiento.' : '');
    }

    // "Mi WhatsApp es el mismo número de contacto"
    var tel = document.getElementById('j-tel');
    var wa = document.getElementById('j-wa');
    var same = document.getElementById('j-wa-same');
    function syncWa() { if (same.checked) wa.value = tel.value; wa.readOnly = same.checked; }
    same.addEventListener('change', syncWa);
    tel.addEventListener('input', syncWa);

    // Documento y teléfonos: solo números (y espacios en teléfonos)
    document.getElementById('j-doc').addEventListener('input', function (e) {
      var t = document.getElementById('j-tipo').value;
      if (t !== 'Pasaporte' && t !== 'PPT' && t !== 'PEP') e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    [tel, wa].forEach(function (i) { i.addEventListener('input', function () { i.value = i.value.replace(/[^0-9+ ]/g, ''); }); });
  }

  /* ============================================================
     Envío de formularios (Contáctanos y Trabaja con nosotros)
     ============================================================ */
  var ENDPOINTS = { FORM_ENDPOINT: FORM_ENDPOINT, JOBS_ENDPOINT: JOBS_ENDPOINT };
  document.querySelectorAll('#contact-form, #job-form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var submit = form.querySelector('.form-submit');
    var endpoint = ENDPOINTS[form.getAttribute('data-endpoint')] || '';

    function setStatus(msg, type) {
      status.textContent = msg;
      status.className = 'form-status' + (type ? ' is-' + type : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('was-validated');

      if (!form.checkValidity()) {
        var firstInvalid = form.querySelector(':invalid:not(fieldset)');
        var custom = firstInvalid && firstInvalid.validationMessage && firstInvalid.id === 'j-exp' && firstInvalid.value ? firstInvalid.validationMessage : '';
        setStatus(custom || form.getAttribute('data-required-msg'), 'error');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!endpoint) {
        setStatus('El formulario aún no está conectado. Mientras tanto, escríbenos por Instagram: @voz360_contact_center.', 'error');
        return;
      }

      submit.disabled = true;
      setStatus('Enviando…');

      fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('.field-hint').forEach(function (h) { h.textContent = 'Día / mes / año'; h.classList.remove('is-set'); });
        setStatus(form.getAttribute('data-ok-msg'), 'ok');
      }).catch(function () {
        setStatus('No pudimos enviar el formulario. Inténtalo de nuevo en unos minutos.', 'error');
      }).then(function () {
        submit.disabled = false;
      });
    });
  });

  /* ============================================================
     Tecnología: tarjetas en órbita + ventana con el detalle
     (basada en seccion-tecnologia-voz360.html)
     ============================================================ */
  (function tecnologia(){
    if(!document.getElementById('tecnologia')) return;
    // ✏️ Edita aquí los textos de cada tarjeta
    var DATA = {
      1:{t:'Gestión omnicanal',s:'CANALES EN UNA SOLA VISTA',x:'Llamadas, chat, correo y redes sociales llegan a una misma bandeja. Tu equipo atiende cada conversación con el contexto completo, sin saltar entre plataformas.',p:['Una sola bandeja para todos los canales','Historial unificado por cliente','Cada caso llega al asesor indicado']},
      2:{t:'Monitoreo y grabación',s:'CALIDAD ACOMPAÑADA',x:'Escucha y revisa las interacciones en vivo o grabadas para acompañar a tus asesores y asegurar que cada cliente reciba el mejor servicio.',p:['Monitoreo de interacciones en tiempo real','Grabaciones fáciles de buscar','Retroalimentación con casos reales']},
      3:{t:'Reportes en vivo',s:'INFORMACIÓN OPORTUNA',x:'Mira lo que está pasando en tu operación en el momento: volumen, tiempos de espera y niveles de servicio, para decidir sin esperar al cierre del día.',p:['Indicadores en tiempo real','Alertas cuando algo se desvía','Reportes listos para compartir']},
      4:{t:'Dashboards',s:'DESEMPEÑO A LA VISTA',x:'Tableros visuales que muestran el desempeño de equipos, campañas y canales de un vistazo, adaptados a lo que cada área necesita ver.',p:['Vistas por rol y por equipo','Metas y tendencias claras','Comparativos por periodo']},
      5:{t:'CRM integrado',s:'HISTORIAL CONECTADO',x:'Cada contacto queda registrado con su historial completo, para que cualquier asesor retome la conversación justo donde quedó.',p:['Ficha completa de cada cliente','Seguimiento de casos y gestiones','Conexión con tus sistemas actuales']},
      6:{t:'Automatización',s:'MENOS TAREAS REPETITIVAS',x:'Flujos, bots y respuestas automáticas se encargan de lo repetitivo, para que tu equipo se enfoque en lo que realmente genera valor.',p:['Bots y respuestas automáticas','Asignación y seguimiento automático','Menos errores manuales']},
      7:{t:'Gestión de calidad',s:'MEJORA CONTINUA',x:'Evaluaciones, formularios y planes de mejora que convierten cada interacción en una oportunidad para crecer como equipo.',p:['Formularios de evaluación a la medida','Seguimiento por asesor','Planes de mejora continua']},
      8:{t:'Analítica',s:'DATOS PARA DECIDIR',x:'Convierte los datos de tu operación en hallazgos: patrones, motivos de contacto y oportunidades para tomar mejores decisiones.',p:['Motivos de contacto identificados','Tendencias y patrones','Decisiones basadas en datos']}
    };
    var sec=document.getElementById('tecnologia'), stage=sec.querySelector('.tec-stage'), scaler=sec.querySelector('.tec-scaler');
    var modal=document.getElementById('tec-modal'), bubble=document.getElementById('tec-bubble'), lastBtn=null, closing=false;
  
    function fit(){
      if (window.innerWidth<=900){stage.style.transform='';scaler.style.height='';return;}
      var k=Math.min(1,scaler.clientWidth/1440);
      stage.style.transform='scale('+k+')';
      stage.style.marginLeft=Math.max(0,(scaler.clientWidth-1440*k)/2)+'px';
      scaler.style.height=(1000*k)+'px';
    }
    window.addEventListener('resize',fit); fit();
  
    // ===== Órbita: las tarjetas giran en círculo alrededor de la imagen =====
    var orbit=sec.querySelector('.tec-orbit'), floats=[].slice.call(sec.querySelectorAll('.tec-float'));
    var VUELTA=40;            // segundos por vuelta completa (más alto = más lento)
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ang=0, last=null, paused=false;
    function place(){
      var mobile=window.innerWidth<=900, W=orbit.clientWidth, H=orbit.clientHeight;
      var cw=floats[0].offsetWidth, ch=floats[0].offsetHeight;
      var cx=W/2, cy=mobile?H/2:565;
      var rx=mobile?(W-cw)/2-6:570, ry=mobile?H/2-ch/2-6:340;
      floats.forEach(function(el,i){
        var a=ang+i*Math.PI*2/floats.length;
        var depth=(Math.sin(a)+1)/2;               // 0 = atrás (arriba), 1 = adelante (abajo)
        var sc=0.88+0.12*depth;
        var x=cx+rx*Math.cos(a)-cw/2, y=cy+ry*Math.sin(a)-ch/2;
        el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) scale('+sc.toFixed(3)+')';
        el.style.zIndex=10+Math.round(depth*10);
      });
    }
    var onScreen=true;
    if('IntersectionObserver' in window){new IntersectionObserver(function(e){onScreen=e[0].isIntersecting;last=null;},{rootMargin:'100px 0px'}).observe(sec);}
    function tick(t){
      requestAnimationFrame(tick);
      if(!onScreen) return;
      if(last!==null && !paused && !reduce) ang+=((t-last)/1000)*(Math.PI*2/VUELTA);
      last=t; place();
    }
    requestAnimationFrame(tick);
    floats.forEach(function(el){
      el.addEventListener('mouseenter',function(){paused=true;});
      el.addEventListener('mouseleave',function(){if(!modal.classList.contains('is-open'))paused=false;});
    });
  
    function open(btn){
      var d=DATA[btn.getAttribute('data-tec')], r=btn.getBoundingClientRect();
      document.getElementById('tec-pnum').textContent=('0'+btn.getAttribute('data-tec')).slice(-2);
      document.getElementById('tec-psub').textContent=d.s;
      document.getElementById('tec-ptitle').textContent=d.t;
      document.getElementById('tec-ptext').textContent=d.x;
      var ul=document.getElementById('tec-points'); ul.innerHTML='';
      d.p.forEach(function(t){var li=document.createElement('li');li.textContent=t;ul.appendChild(li);});
      bubble.style.left=(r.left+r.width/2)+'px'; bubble.style.top=(r.top+r.height/2)+'px';
      lastBtn=btn; closing=false;
      modal.classList.remove('is-open','is-closing'); void modal.offsetWidth;
      modal.classList.add('is-open'); paused=true;
      document.body.style.overflow='hidden';
      setTimeout(function(){modal.querySelector('.tec-close').focus({preventScroll:true});},300);
    }
    function close(){
      if(!modal.classList.contains('is-open')||closing) return;
      closing=true; modal.classList.add('is-closing');
      setTimeout(function(){modal.classList.remove('is-open','is-closing');document.body.style.overflow='';paused=false;if(lastBtn)lastBtn.focus({preventScroll:true});},350);
    }
    sec.querySelectorAll('.tec-card').forEach(function(b){b.addEventListener('click',function(){open(b);});});
    modal.querySelectorAll('[data-tec-close]').forEach(function(b){b.addEventListener('click',close);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  })();

  /* Año del footer */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
