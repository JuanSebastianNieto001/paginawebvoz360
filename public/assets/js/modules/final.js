/* ==========================================================================
   FINAL — montaña animada con Misión y Visión
   La escena completa depende del progreso del scroll dentro de la sección #vzf (0–1):
     cielo          mañana → mediodía → atardecer → noche (4 capas que se funden)
     montaña        las capas suben con distinta velocidad (paralaje)
     muñequito      recorre el sendero (#vzf-trail) de 0.06 a 0.82 y el tramo
                    recorrido se "pinta" con stroke-dashoffset
     Misión/Visión  entran deslizándose (0.18 y 0.40) y salen en 0.72
     cima           bandera, fuegos artificiales y celebración desde 0.82
   El progreso se suaviza (sigue al scroll con inercia) y el bucle de
   animación solo corre mientras hay movimiento pendiente.
   En pantallas verticales la vista se centra en la cima (viewBox).
   Rendimiento: la escena son capas apiladas (un SVG o div por capa) que se
   mueven con transform/opacity en la GPU, sin repintar el dibujo. El
   muñequito y las aves son capas pequeñas que también se desplazan en la GPU;
   solo se repintan sus movimientos internos (pasos, aleteo) y el tramo
   recorrido del sendero. El sendero se muestrea una vez al cargar.
   Estilos: css/sections/final.css
   ========================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('vzf');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };

  var trail = $('vzf-trail'), done = $('vzf-done'), doneGlow = $('vzf-done-glow');
  var hiker = $('vzf-hiker'), flip = $('vzf-flip'), lamp = $('vzf-lamp');
  var flag = $('vzf-flag'), cloth = $('vzf-cloth'), burst = $('vzf-burst');
  // Capas de la escena (se mueven enteras)
  var mtn = $('vzf-mtn'), top = $('vzf-top'), summit = $('vzf-summit'), l1 = $('vzf-l1'), l2 = $('vzf-l2'), l3 = $('vzf-l3');
  var f1 = $('vzf-fog1'), f2 = $('vzf-fog2'), f3 = $('vzf-fog3');
  var sun = $('vzf-sun'), moon = $('vzf-moon'), stars = $('vzf-stars'), clouds = $('vzf-clouds');
  var birdsL1 = $('vzf-birdsl1'), birdsL2 = $('vzf-birdsl2'), hikerLayer = $('vzf-hikerl');
  var skyLayers = root.querySelectorAll('.vzf-sky i');   // k0 (mañana) siempre visible; k1–k3 se funden encima
  var money = $('vzf-money'), mvM = $('vzf-mvm'), mvV = $('vzf-mvv');
  var svgs = root.querySelectorAll('.vzf-bg svg[preserveAspectRatio]');   // capas a pantalla completa
  var badge = $('vzf-sbadge');
  var bRect = badge.querySelector('rect'), bTip = badge.querySelector('path'), bImg = badge.querySelector('image');

  var SMOOTHING = .09;   // fracción del camino recorrida por cuadro (más bajo = más inercia)
  var TRAIL_SAMPLES = 400;
  var RESIZE_DEBOUNCE = 120;   // ms: los resize seguidos se agrupan en uno
  var RESIZE_MIN_DH = 120;     // px: en táctiles se ignoran cambios menores de alto (barra de direcciones)

  /* Sendero: el tramo recorrido se dibuja con stroke-dashoffset (sin recalcular puntos) */
  var L = trail.getTotalLength();
  [done, doneGlow].forEach(function (p) {
    p.setAttribute('d', trail.getAttribute('d'));
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
  });
  // Puntos del sendero muestreados una sola vez (getPointAtLength es costoso en cada cuadro)
  var trailPts = [];
  for (var i = 0; i <= TRAIL_SAMPLES; i++) {
    var pt = trail.getPointAtLength(i / TRAIL_SAMPLES * L);
    trailPts.push([pt.x, pt.y]);
  }
  function pointAt(d) {
    var f = Math.max(0, Math.min(1, d / L)) * TRAIL_SAMPLES, k = Math.min(TRAIL_SAMPLES - 1, Math.floor(f)), t = f - k;
    var a = trailPts[k], b = trailPts[k + 1];
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t };
  }

  /* ---------- Encuadre según la orientación ---------- */
  var hikerScale = 1.6;
  var unit = 1;            // px de pantalla por unidad del dibujo (1440×900 con "slice")
  var originX = 0, originY = 0;   // px de pantalla donde cae el punto (0,0) del dibujo
  function layout() {
    var W = window.innerWidth, H = window.innerHeight, portrait = W / H < .9;
    unit = Math.max(W / 1440, H / 900);
    // 720 = centro del dibujo; en vertical se corre hacia la cima (entre el mensaje y la bandera)
    var cx = portrait ? Math.min(800, 720 + (1 - W / H) * 150) : 720;
    svgs.forEach(function (s) { s.setAttribute('viewBox', (cx - 720).toFixed(0) + ' 0 1440 900'); });
    originX = (W - 1440 * unit) / 2 - (cx - 720) * unit;
    originY = (H - 900 * unit) / 2;
    hikerScale = portrait ? 1.3 : 1.6;
    // Capa del muñequito: su viewBox mide 200×100 unidades (de -100,-90 a 100,10)
    hikerLayer.style.width = (200 * unit * hikerScale).toFixed(1) + 'px';
    hikerLayer.style.height = (100 * unit * hikerScale).toFixed(1) + 'px';
    // Mensaje con el logo en la cima: más pequeño y a la izquierda de la bandera en vertical
    var b = portrait
      ? { x: 622, y: 168, w: 196, h: 72, rx: 18, tip: 'M818 192 l18 11 -18 10z', ix: 648, iy: 180, iw: 144, ih: 50 }
      : { x: 548, y: 200, w: 252, h: 92, rx: 22, tip: 'M800 232 l22 14 -22 12z', ix: 586, iy: 214, iw: 176, ih: 64 };
    bRect.setAttribute('x', b.x); bRect.setAttribute('y', b.y); bRect.setAttribute('width', b.w); bRect.setAttribute('height', b.h); bRect.setAttribute('rx', b.rx);
    bTip.setAttribute('d', b.tip);
    bImg.setAttribute('x', b.ix); bImg.setAttribute('y', b.iy); bImg.setAttribute('width', b.iw); bImg.setAttribute('height', b.ih);
  }

  /* ---------- Utilidades ---------- */
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // Asigna un estilo solo si cambió (evita recalcular estilos de más)
  function css(el, prop, value) {
    var cache = el.__vzf || (el.__vzf = {});
    if (cache[prop] !== value) { el.style[prop] = value; cache[prop] = value; }
  }
  // Mueve una capa entera, con x/y en unidades del dibujo
  function move(el, x, y) { css(el, 'transform', 'translate3d(' + (x * unit).toFixed(1) + 'px,' + (y * unit).toFixed(1) + 'px,0)'); }
  function fade(el, o) { css(el, 'opacity', o.toFixed(3)); }
  // Asigna un atributo del dibujo solo si cambió (cada cambio obliga a recalcular el SVG)
  function attr(el, name, value) {
    var cache = el.__vzfA || (el.__vzfA = {});
    value = String(value);
    if (cache[name] !== value) { el.setAttribute(name, value); cache[name] = value; }
  }

  /* ---------- Dibujo de un estado (p = progreso 0–1) ---------- */
  var wasCheer = false, wasWin = false, birdsGone = null;
  function draw(p) {
    // Cielo: cada momento del día se funde sobre el anterior
    for (var k = 1; k < skyLayers.length; k++) fade(skyLayers[k], clamp(p * 3 - (k - 1)));

    // Día → noche
    var night = clamp((p - .62) / .25);
    fade(stars, night);
    move(sun, -p * 260, ease(clamp(p / .8)) * 520);
    fade(sun, 1 - clamp((p - .55) / .25));
    fade(moon, night);
    move(moon, 0, (1 - night) * 120);
    move(clouds, -p * 220, p * 30);
    fade(clouds, 1 - night * .6);
    // Aves: se ocultan (y dejan de aletear) cuando ya no se ven
    var birdsOpacity = 1 - clamp((p - .55) / .1);
    var gone = birdsOpacity <= 0;
    if (gone !== birdsGone) { birdsL1.classList.toggle('is-gone', gone); birdsL2.classList.toggle('is-gone', gone); birdsGone = gone; }
    if (!gone) {
      move(birdsL1, -200 + clamp(p / .62) * 1850, 250 - p * 110);
      fade(birdsL1, birdsOpacity);
      move(birdsL2, 1600 - clamp((p - .08) / .5) * 1850, 360 - p * 80);   // la bandada 2 ya está girada (scale -1 1)
      fade(birdsL2, birdsOpacity * .85);
    }

    // Paralaje de las capas de montaña y niebla
    var e = ease(p);
    move(l1, 0, (1 - e) * 140);
    move(f1, 0, (1 - e) * 140);
    move(l2, 0, (1 - e) * 230);
    move(f2, 0, (1 - e) * 230);
    move(l3, 0, (1 - e) * 320);
    move(mtn, 0, (1 - e) * 520);
    move(top, 0, (1 - e) * 520);
    move(summit, 0, (1 - e) * 520);
    fade(f1, .8 * (1 - night * .7));
    fade(f2, .8 * (1 - night * .7));
    fade(f3, .5 * (1 - night * .7));

    // Muñequito sobre el sendero: posición, dirección e inclinación de la pendiente
    var kk = clamp((p - .06) / .76), d = kk * L;
    var pt = pointAt(d), next = pointAt(Math.min(L, d + 3)), prev = pointAt(Math.max(0, d - 3));
    var dx = next.x - prev.x, dy = next.y - prev.y, dir = dx < 0 ? -1 : 1, tilt = Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI * .35;
    // La capa del muñequito sigue al punto del sendero (y a la montaña, que también sube)
    var hx = originX + pt.x * unit - 100 * unit * hikerScale;
    var hy = originY + (pt.y + (1 - e) * 520) * unit - 90 * unit * hikerScale;
    css(hikerLayer, 'transform', 'translate3d(' + hx.toFixed(1) + 'px,' + hy.toFixed(1) + 'px,0)');
    attr(flip, 'transform', 'scale(' + dir + ' 1) rotate(' + (kk >= 1 ? 0 : tilt).toFixed(1) + ')');
    attr(lamp, 'opacity', (night * .9).toFixed(2));
    var offset = (L - d).toFixed(1);
    css(done, 'strokeDashoffset', offset);
    css(doneGlow, 'strokeDashoffset', offset);

    // Cima: bandera y celebración
    var fl = clamp((p - .82) / .06);
    attr(flag, 'opacity', kk >= 1 ? 1 : 0);
    attr(cloth, 'transform', 'translate(0 ' + ((1 - fl) * 46).toFixed(1) + ')');
    attr(burst, 'opacity', fl >= 1 ? 1 : 0);
    fade(money, clamp((p - .04) / .12));   // monedas y billetes al empezar a subir

    // Misión (izquierda) y Visión (derecha) entran deslizándose; en móvil Misión sale antes
    var mobile = window.innerWidth <= 760, W = window.innerWidth;
    var mi = ease(clamp((p - .18) / .08)), vi = ease(clamp((p - .40) / .08)), out = clamp((p - .72) / .05);
    var mo = mobile ? Math.max(out, clamp((p - .38) / .04)) : out;
    fade(mvM, mi * (1 - mo));
    css(mvM, 'transform', 'translate(' + (-(1 - mi) * W * .5).toFixed(1) + 'px,' + (-mo * 30).toFixed(1) + 'px)');
    fade(mvV, vi * (1 - out));
    css(mvV, 'transform', 'translate(' + ((1 - vi) * W * .5).toFixed(1) + 'px,' + (-out * 30).toFixed(1) + 'px)');

    var win = fl >= 1;
    if (win !== wasWin) { root.classList.toggle('vzf-win', win); wasWin = win; }
    var cheer = kk >= 1 && fl >= 1;
    if (cheer !== wasCheer) { hiker.classList.toggle('vzf-cheer', cheer); wasCheer = cheer; }
  }

  /* ---------- Bucle: sigue al scroll con inercia ---------- */
  // Posición de la sección guardada: el scroll no mide el DOM
  var secTop = 0, secTravel = 1;
  function measure() {
    secTop = root.getBoundingClientRect().top + window.scrollY;
    secTravel = Math.max(1, root.offsetHeight - window.innerHeight);
  }
  var target = 0, current = 0, running = false, lastTs = 0, walking = false;
  function read() { target = clamp((window.scrollY - secTop) / secTravel); }
  function setWalking(on) { if (on !== walking) { hiker.classList.toggle('vzf-walking', on); walking = on; } }
  function loop(ts) {
    var dt = lastTs ? Math.min(100, ts - lastTs) : 16.7;
    lastTs = ts;
    var diff = target - current;
    current += diff * (1 - Math.pow(1 - SMOOTHING, dt / 16.7));   // independiente de los FPS
    setWalking(Math.abs(diff) > .0006 && current < .82 && !wasCheer);
    draw(current);
    if (Math.abs(diff) > .0001) requestAnimationFrame(loop);
    else { running = false; lastTs = 0; setWalking(false); }
  }
  function kick() {
    read();
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  layout();
  measure();

  // Resize agrupado; en pantallas táctiles se ignora el que solo cambia un poco el alto
  // (la barra de direcciones del celular lo dispara al hacer scroll y layout() reescribe el viewBox de todas las capas))
  function onResize(fn) {
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var w = window.innerWidth, h = window.innerHeight, timer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var nw = window.innerWidth, nh = window.innerHeight;
        if (coarse && nw === w && Math.abs(nh - h) < RESIZE_MIN_DH) return;
        w = nw; h = nh;
        requestAnimationFrame(fn);
      }, RESIZE_DEBOUNCE);
    });
  }
  onResize(function () { layout(); measure(); draw(current); kick(); });
  window.addEventListener('load', function () { measure(); kick(); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); }).observe(document.body);
  window.addEventListener('scroll', kick, { passive: true });
  read();
  current = target;
  draw(current);
})();
