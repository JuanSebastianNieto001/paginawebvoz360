/* ==========================================================================
   BOT VOZ360 — botón flotante con panel tipo chat
   Opciones: "Contáctanos", "Trabaja con nosotros" y "Preguntas frecuentes".
   - Al abrirlo, el bot "escribe" y los mensajes aparecen uno tras otro.
   - Al elegir una opción se oculta el menú (como en un chat) y aparece una
     flecha para volver.
   - Preguntas frecuentes: la pregunta elegida se envía, el bot "escribe" y
     responde (las respuestas están en <template id="faq-a-N"> del HTML).
   - Los enlaces a #contacto, #trabaja y #faq de toda la página abren el bot
     directamente en esa opción.
   - WhatsApp: usa el número de config.js; si está vacío, el bot avisa.
   Estilos: css/components/bot.css
   ========================================================================== */
(function () {
  'use strict';

  var bot = document.getElementById('bot');
  if (!bot) return;
  var config = (window.VOZ360 && window.VOZ360.config) || {};

  var HINT_VISIBLE = 2600;   // ms que se ve la burbuja "¿Hablamos?"
  var HINT_GAP = 4000;       // ms entre una aparición y la siguiente
  var LINKS = 'a[href="#contacto"], a[href="#trabaja"], a[href="#faq"]';

  var panel = bot.querySelector('.bot-panel');
  var body = bot.querySelector('.bot-body');
  var launcher = bot.querySelector('.bot-launcher');
  var backBtn = bot.querySelector('.bot-back');
  var steps = bot.querySelectorAll('.bot-body > .bot-msg, .bot-body > .bot-options');
  var options = bot.querySelectorAll('.bot-opt');
  var faqChat = bot.querySelector('#flow-faq .bot-chat');
  var faqChips = bot.querySelector('#flow-faq .bot-chips');
  var timers = [];
  var returnFocus = null;

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function scrollToEnd() { body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }); }
  function showAllSteps() { steps.forEach(function (el) { el.classList.add('is-shown'); }); }

  /* ---------- Flujos (opciones) ---------- */

  // Muestra el flujo elegido ("contacto", "trabaja" o "faq") y oculta el menú
  function showFlow(name) {
    options.forEach(function (b) {
      var on = b.getAttribute('data-flow') === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-expanded', String(on));
      document.getElementById('flow-' + b.getAttribute('data-flow')).hidden = !on;
    });
    var flow = document.getElementById('flow-' + name);
    if (!flow) return;
    bot.classList.add('in-flow');
    backBtn.hidden = false;
    body.scrollTop = 0;
    setTimeout(function () {
      body.scrollTo({ top: 0 });
      // Con mouse, el foco va al primer campo; en táctil no, para no abrir el teclado
      var first = flow.querySelector('input, select, textarea, .bot-chip');
      if (first && window.matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
    }, 80);
  }

  // Deja el bot en el menú inicial, sin ningún flujo abierto
  function resetFlows() {
    bot.classList.remove('in-flow');
    backBtn.hidden = true;
    resetFaq();
    var waNote = bot.querySelector('.bot-wa-note');
    if (waNote) waNote.remove();
    options.forEach(function (b) {
      b.classList.remove('is-active');
      b.setAttribute('aria-expanded', 'false');
      document.getElementById('flow-' + b.getAttribute('data-flow')).hidden = true;
    });
  }

  backBtn.addEventListener('click', function () {
    resetFlows();
    showAllSteps();
    body.scrollTop = 0;
    var first = bot.querySelector('.bot-opt');
    if (first) first.focus({ preventScroll: true });
  });
  options.forEach(function (b) {
    b.addEventListener('click', function () { showFlow(b.getAttribute('data-flow')); });
  });
  // Botones dentro de las respuestas (p. ej. "Contáctanos") saltan a otra opción
  bot.addEventListener('click', function (e) {
    var go = e.target.closest && e.target.closest('[data-go]');
    if (go) showFlow(go.getAttribute('data-go'));
  });

  /* ---------- WhatsApp ---------- */
  var waLink = bot.querySelector('[data-whatsapp]');
  if (waLink) {
    if (config.WHATSAPP_NUMBER) {
      waLink.href = 'https://wa.me/' + config.WHATSAPP_NUMBER + '?text=' + encodeURIComponent(config.WHATSAPP_TEXT || '');
    }
    waLink.addEventListener('click', function (e) {
      if (config.WHATSAPP_NUMBER) return;
      e.preventDefault();
      if (bot.querySelector('.bot-wa-note')) return;
      var note = document.createElement('div');
      note.className = 'bot-msg bot-wa-note is-shown';
      note.innerHTML = 'Muy pronto podrás escribirnos por <b>WhatsApp</b>. Mientras tanto, encuéntranos en ' +
        '<a href="' + config.INSTAGRAM_URL + '" target="_blank" rel="noopener">Instagram</a> 💬';
      waLink.closest('.bot-msg--info').after(note);
      scrollToEnd();
    });
  }

  /* ---------- Preguntas frecuentes (conversación) ---------- */
  function resetFaq() {
    if (!faqChat) return;
    faqChat.innerHTML = '';
    faqChips.hidden = false;
    faqChips.querySelectorAll('.bot-chip').forEach(function (c) { c.classList.remove('is-asked'); });
  }

  function botMessage(className, text) {
    var el = document.createElement('div');
    el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  if (faqChat && faqChips) {
    faqChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.bot-chip');
      if (!chip) return;
      var i = chip.getAttribute('data-q');
      faqChat.appendChild(botMessage('bot-msg bot-msg--user', chip.textContent));
      chip.classList.add('is-asked');
      faqChips.hidden = true;

      var typing = botMessage('bot-msg bot-msg--typing');
      typing.setAttribute('aria-label', 'Bot Voz360 está escribiendo');
      typing.innerHTML = '<span></span><span></span><span></span>';
      later(function () { faqChat.appendChild(typing); scrollToEnd(); }, 350);
      later(function () {
        typing.remove();
        var answer = botMessage('bot-msg');
        answer.innerHTML = document.getElementById('faq-a-' + i).innerHTML;   // contenido propio del HTML
        faqChat.appendChild(answer);
        faqChat.appendChild(botMessage('bot-msg', '¿Tienes otra pregunta? Elige una 👇'));
        faqChips.hidden = false;
        scrollToEnd();
      }, 1400);
      scrollToEnd();
    });
  }

  /* ---------- Abrir / cerrar ---------- */

  // Saludo animado: "escribiendo…" antes de cada mensaje
  function playIntro() {
    clearTimers();
    steps.forEach(function (el) { el.classList.remove('is-shown'); });
    var t = 0;
    steps.forEach(function (el) {
      var isMsg = el.classList.contains('bot-msg') && !el.classList.contains('bot-msg--info');
      if (isMsg) {
        later(function () { bot.classList.add('is-typing'); }, t);
        t += 650;
      }
      later(function () { bot.classList.remove('is-typing'); el.classList.add('is-shown'); }, t);
      t += isMsg ? 250 : 180;
    });
  }

  /** Abre el bot; si se indica `flow`, entra directo en esa opción. */
  function open(flow) {
    if (bot.classList.contains('is-open')) { if (flow) showFlow(flow); return; }
    returnFocus = document.activeElement;
    bot.classList.remove('show-hint');
    bot.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Cerrar chat con Bot Voz360');
    // En móvil el panel ocupa la pantalla: se bloquea el scroll de la página
    if (window.matchMedia('(max-width: 640px)').matches) document.documentElement.style.overflow = 'hidden';
    resetFlows();
    body.scrollTop = 0;
    if (flow) { showAllSteps(); showFlow(flow); }
    else playIntro();
    setTimeout(function () { bot.querySelector('.bot-close').focus({ preventScroll: true }); }, 60);
  }

  function close() {
    if (!bot.classList.contains('is-open')) return;
    clearTimers();
    bot.classList.remove('is-open', 'is-typing');
    panel.setAttribute('aria-hidden', 'true');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Abrir chat con Bot Voz360');
    document.documentElement.style.overflow = '';
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  }

  launcher.addEventListener('click', function () { bot.classList.contains('is-open') ? close() : open(); });
  bot.querySelector('.bot-close').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // Clic fuera del panel lo cierra (salvo en los enlaces que lo abren)
  document.addEventListener('pointerdown', function (e) {
    if (bot.classList.contains('is-open') && !bot.contains(e.target) && !e.target.closest(LINKS)) close();
  });

  // "Hablemos", "Solicitar propuesta"… abren Contáctanos; "Trabaja con nosotros" y "FAQ", su opción
  document.querySelectorAll(LINKS).forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var href = a.getAttribute('href');
      open(href === '#trabaja' ? 'trabaja' : href === '#faq' ? 'faq' : 'contacto');
    });
  });

  /* ---------- Burbuja "¿Hablamos?" ---------- */
  // Aparece, se queda un rato, se va y vuelve a salir. Se pausa con el chat abierto o la intro.
  (function hintLoop() {
    var introActive = function () { return document.documentElement.classList.contains('intro-active'); };
    setTimeout(function () {
      if (bot.classList.contains('is-open') || introActive()) return hintLoop();
      bot.classList.add('show-hint');
      setTimeout(function () { bot.classList.remove('show-hint'); hintLoop(); }, HINT_VISIBLE);
    }, introActive() ? 1000 : HINT_GAP);
  })();
})();
