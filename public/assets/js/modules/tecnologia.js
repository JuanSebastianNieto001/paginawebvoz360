/* ==========================================================================
   TECNOLOGÍA — tarjetas en órbita + ventana con el detalle
   - La escena mide 1440×1000 y se escala para caber en la pantalla (en
     ≤ 900 px no se escala: el CSS la reacomoda).
   - Las 8 tarjetas giran en una elipse alrededor de la ilustración; las de
     abajo quedan "adelante" (más grandes y con mayor z-index).
   - Al tocar una tarjeta se abre una ventana con el detalle (textos en DATA).
   Rendimiento: las medidas se leen solo al cargar y al redimensionar, y el
   z-index se cambia solo cuando varía.
   Estilos: css/sections/tecnologia.css
   ========================================================================== */
(function () {
  'use strict';

  var sec = document.getElementById('tecnologia');
  if (!sec) return;

  var STAGE_W = 1440, STAGE_H = 1000;   // tamaño de diseño de la escena
  var LAP_SECONDS = 40;                 // segundos por vuelta completa (más alto = más lento)
  var MOBILE_MAX = 900;

  // ✏️ Textos de la ventana de cada tarjeta (el número es data-tec del HTML)
  var DATA = {
    1: { t: 'Gestión omnicanal', s: 'CANALES EN UNA SOLA VISTA', x: 'Llamadas, chat, correo y redes sociales llegan a una misma bandeja. Tu equipo atiende cada conversación con el contexto completo, sin saltar entre plataformas.', p: ['Una sola bandeja para todos los canales', 'Historial unificado por cliente', 'Cada caso llega al asesor indicado'] },
    2: { t: 'Monitoreo y grabación', s: 'CALIDAD ACOMPAÑADA', x: 'Escucha y revisa las interacciones en vivo o grabadas para acompañar a tus asesores y asegurar que cada cliente reciba el mejor servicio.', p: ['Monitoreo de interacciones en tiempo real', 'Grabaciones fáciles de buscar', 'Retroalimentación con casos reales'] },
    3: { t: 'Reportes en vivo', s: 'INFORMACIÓN OPORTUNA', x: 'Mira lo que está pasando en tu operación en el momento: volumen, tiempos de espera y niveles de servicio, para decidir sin esperar al cierre del día.', p: ['Indicadores en tiempo real', 'Alertas cuando algo se desvía', 'Reportes listos para compartir'] },
    4: { t: 'Dashboards', s: 'DESEMPEÑO A LA VISTA', x: 'Tableros visuales que muestran el desempeño de equipos, campañas y canales de un vistazo, adaptados a lo que cada área necesita ver.', p: ['Vistas por rol y por equipo', 'Metas y tendencias claras', 'Comparativos por periodo'] },
    5: { t: 'CRM integrado', s: 'HISTORIAL CONECTADO', x: 'Cada contacto queda registrado con su historial completo, para que cualquier asesor retome la conversación justo donde quedó.', p: ['Ficha completa de cada cliente', 'Seguimiento de casos y gestiones', 'Conexión con tus sistemas actuales'] },
    6: { t: 'Automatización', s: 'MENOS TAREAS REPETITIVAS', x: 'Flujos, bots y respuestas automáticas se encargan de lo repetitivo, para que tu equipo se enfoque en lo que realmente genera valor.', p: ['Bots y respuestas automáticas', 'Asignación y seguimiento automático', 'Menos errores manuales'] },
    7: { t: 'Gestión de calidad', s: 'MEJORA CONTINUA', x: 'Evaluaciones, formularios y planes de mejora que convierten cada interacción en una oportunidad para crecer como equipo.', p: ['Formularios de evaluación a la medida', 'Seguimiento por asesor', 'Planes de mejora continua'] },
    8: { t: 'Analítica', s: 'DATOS PARA DECIDIR', x: 'Convierte los datos de tu operación en hallazgos: patrones, motivos de contacto y oportunidades para tomar mejores decisiones.', p: ['Motivos de contacto identificados', 'Tendencias y patrones', 'Decisiones basadas en datos'] }
  };

  var stage = sec.querySelector('.tec-stage');
  var scaler = sec.querySelector('.tec-scaler');
  var orbit = sec.querySelector('.tec-orbit');
  var floats = [].slice.call(sec.querySelectorAll('.tec-float'));
  var modal = document.getElementById('tec-modal');
  var bubble = document.getElementById('tec-bubble');

  /* ---------- Escala de la escena ---------- */
  function fit() {
    if (window.innerWidth <= MOBILE_MAX) { stage.style.transform = ''; stage.style.marginLeft = stage.style.marginTop = ''; return; }
    var w = scaler.clientWidth, h = scaler.clientHeight, k = Math.min(w / STAGE_W, h / STAGE_H);
    stage.style.transform = 'scale(' + k + ')';
    stage.style.marginLeft = Math.max(0, (w - STAGE_W * k) / 2) + 'px';   // centrada
    stage.style.marginTop = Math.max(0, (h - STAGE_H * k) / 2) + 'px';
  }

  /* ---------- Órbita ---------- */
  var angle = 0, last = null, paused = false, onScreen = true;
  var G = {};                                     // medidas en caché
  var zIndexes = floats.map(function () { return -1; });

  function measure() {
    var mobile = window.innerWidth <= MOBILE_MAX, W = orbit.clientWidth, H = orbit.clientHeight;
    var cw = floats[0].offsetWidth, ch = floats[0].offsetHeight;
    // centro (cx, cy) y radios (rx, ry) de la elipse
    G = { cw: cw, ch: ch, cx: W / 2, cy: mobile ? H / 2 : 565, rx: mobile ? (W - cw) / 2 - 6 : 570, ry: mobile ? H / 2 - ch / 2 - 6 : 340 };
  }

  function place() {
    floats.forEach(function (el, i) {
      var a = angle + i * Math.PI * 2 / floats.length;
      var depth = (Math.sin(a) + 1) / 2;          // 0 = atrás (arriba) · 1 = adelante (abajo)
      var sc = 0.88 + 0.12 * depth;
      var x = G.cx + G.rx * Math.cos(a) - G.cw / 2, y = G.cy + G.ry * Math.sin(a) - G.ch / 2;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
      var z = 10 + Math.round(depth * 10);
      if (z !== zIndexes[i]) { el.style.zIndex = z; zIndexes[i] = z; }
    });
  }

  function tick(t) {
    requestAnimationFrame(tick);
    if (!onScreen) return;
    if (last !== null && !paused) angle += ((t - last) / 1000) * (Math.PI * 2 / LAP_SECONDS);
    last = t;
    place();
  }

  fit();
  measure();
  window.addEventListener('resize', function () { fit(); measure(); place(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; last = null; }, { rootMargin: '100px 0px' }).observe(sec);
  }
  requestAnimationFrame(tick);

  /* ---------- Ventana con el detalle ---------- */
  var lastBtn = null, closing = false;

  function open(btn) {
    var d = DATA[btn.getAttribute('data-tec')], r = btn.getBoundingClientRect();
    document.getElementById('tec-pnum').textContent = ('0' + btn.getAttribute('data-tec')).slice(-2);
    document.getElementById('tec-psub').textContent = d.s;
    document.getElementById('tec-ptitle').textContent = d.t;
    document.getElementById('tec-ptext').textContent = d.x;
    var ul = document.getElementById('tec-points');
    ul.innerHTML = '';
    d.p.forEach(function (text) { var li = document.createElement('li'); li.textContent = text; ul.appendChild(li); });
    // La burbuja nace desde la tarjeta tocada
    bubble.style.left = (r.left + r.width / 2) + 'px';
    bubble.style.top = (r.top + r.height / 2) + 'px';
    lastBtn = btn; closing = false;
    modal.classList.remove('is-open', 'is-closing');
    void modal.offsetWidth;                       // reinicia las animaciones
    modal.classList.add('is-open');
    paused = true;                                // la órbita se detiene mientras está abierta
    document.body.style.overflow = 'hidden';
    setTimeout(function () { modal.querySelector('.tec-close').focus({ preventScroll: true }); }, 300);
  }

  function close() {
    if (!modal.classList.contains('is-open') || closing) return;
    closing = true;
    modal.classList.add('is-closing');
    setTimeout(function () {
      modal.classList.remove('is-open', 'is-closing');
      document.body.style.overflow = '';
      paused = false;
      if (lastBtn) lastBtn.focus({ preventScroll: true });
    }, 350);
  }

  sec.querySelectorAll('.tec-card').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
  modal.querySelectorAll('[data-tec-close]').forEach(function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
