/* ==========================================================================
   FINAL — montaña animada con Misión y Visión
   Todo depende del progreso del scroll dentro de la sección #vzf (0–1):
     cielo          mañana → mediodía → atardecer → noche (paleta SKY)
     montaña        las capas suben con distinta velocidad (paralaje)
     muñequito      recorre el sendero (#vzf-trail) de 0.06 a 0.82 y el tramo
                    recorrido se "pinta" con stroke-dashoffset
     Misión/Visión  entran deslizándose (0.18 y 0.40) y salen en 0.72
     cima           bandera, fuegos artificiales y celebración desde 0.82
   El progreso se suaviza (sigue al scroll con inercia) y el bucle de
   animación solo corre mientras hay movimiento pendiente.
   En pantallas verticales la vista se centra en la cima (viewBox).
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
  var mtn = $('vzf-mtn'), l1 = $('vzf-l1'), l2 = $('vzf-l2'), l3 = $('vzf-l3');
  var f1 = $('vzf-fog1'), f2 = $('vzf-fog2'), f3 = $('vzf-fog3');
  var sun = $('vzf-sun'), moon = $('vzf-moon'), stars = $('vzf-stars'), clouds = $('vzf-clouds');
  var birds = $('vzf-birds'), birds2 = $('vzf-birds2');
  var s1 = $('vzf-s1'), s2 = $('vzf-s2'), s3 = $('vzf-s3');   // paradas del degradado del cielo
  var money = $('vzf-money'), mvM = $('vzf-mvm'), mvV = $('vzf-mvv');
  var svgs = root.querySelectorAll('.vzf-bg svg');
  var badge = $('vzf-sbadge');
  var bRect = badge.querySelector('rect'), bTip = badge.querySelector('path'), bImg = badge.querySelector('image');

  var SMOOTHING = .09;   // fracción del camino recorrida por cuadro (más bajo = más inercia)

  /* Sendero: el tramo recorrido se dibuja con stroke-dashoffset (sin recalcular puntos) */
  var L = trail.getTotalLength();
  [done, doneGlow].forEach(function (p) {
    p.setAttribute('d', trail.getAttribute('d'));
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
  });

  /* ---------- Encuadre según la orientación ---------- */
  var hikerScale = 1.6;
  function layout() {
    var W = window.innerWidth, H = window.innerHeight, portrait = W / H < .9;
    // 720 = centro del dibujo; en vertical se corre hacia la cima (entre el mensaje y la bandera)
    var cx = portrait ? Math.min(800, 720 + (1 - W / H) * 150) : 720;
    svgs.forEach(function (s) { s.setAttribute('viewBox', (cx - 720).toFixed(0) + ' 0 1440 900'); });
    hikerScale = portrait ? 1.3 : 1.6;
    // Mensaje con el logo en la cima: más pequeño y a la izquierda de la bandera en vertical
    var b = portrait
      ? { x: 622, y: 168, w: 196, h: 72, rx: 18, tip: 'M818 192 l18 11 -18 10z', ix: 648, iy: 180, iw: 144, ih: 50 }
      : { x: 548, y: 200, w: 252, h: 92, rx: 22, tip: 'M800 232 l22 14 -22 12z', ix: 586, iy: 214, iw: 176, ih: 64 };
    bRect.setAttribute('x', b.x); bRect.setAttribute('y', b.y); bRect.setAttribute('width', b.w); bRect.setAttribute('height', b.h); bRect.setAttribute('rx', b.rx);
    bTip.setAttribute('d', b.tip);
    bImg.setAttribute('x', b.ix); bImg.setAttribute('y', b.iy); bImg.setAttribute('width', b.iw); bImg.setAttribute('height', b.ih);
  }

  /* ---------- Utilidades ---------- */
  // Paleta del cielo (3 paradas por momento): mañana → mediodía azul VOZ → atardecer → noche
  var SKY = [
    [[191, 230, 251], [217, 240, 252], [243, 251, 255]],
    [[74, 160, 232], [140, 205, 245], [210, 240, 252]],
    [[28, 76, 150], [74, 140, 210], [255, 214, 190]],
    [[6, 20, 40], [11, 37, 64], [26, 70, 120]]
  ];
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerpColor(a, b, t) { return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')'; }
  function sky(p) {
    var seg = Math.min(2, Math.floor(p * 3)), t = p * 3 - seg;
    return [0, 1, 2].map(function (k) { return lerpColor(SKY[seg][k], SKY[seg + 1][k], t); });
  }
  function translate(el, x, y) { el.setAttribute('transform', 'translate(' + x + ' ' + y + ')'); }

  /* ---------- Dibujo de un estado (p = progreso 0–1) ---------- */
  var wasCheer = false, wasWin = false;
  function draw(p) {
    var c = sky(p);
    s1.setAttribute('stop-color', c[0]); s2.setAttribute('stop-color', c[1]); s3.setAttribute('stop-color', c[2]);

    // Día → noche
    var night = clamp((p - .62) / .25);
    stars.setAttribute('opacity', night);
    translate(sun, -p * 260, ease(clamp(p / .8)) * 520);
    sun.setAttribute('opacity', 1 - clamp((p - .55) / .25));
    moon.setAttribute('opacity', night);
    translate(moon, 0, (1 - night) * 120);
    translate(clouds, -p * 220, p * 30);
    clouds.setAttribute('opacity', 1 - night * .6);
    var birdsOpacity = 1 - clamp((p - .55) / .1);
    birds.setAttribute('transform', 'translate(' + (-200 + clamp(p / .62) * 1850).toFixed(1) + ' ' + (250 - p * 110).toFixed(1) + ')');
    birds.setAttribute('opacity', birdsOpacity);
    birds2.setAttribute('transform', 'translate(' + (1600 - clamp((p - .08) / .5) * 1850).toFixed(1) + ' ' + (360 - p * 80).toFixed(1) + ') scale(-1 1)');
    birds2.setAttribute('opacity', birdsOpacity * .85);

    // Paralaje de las capas de montaña y niebla
    var e = ease(p);
    translate(l1, 0, (1 - e) * 140);
    translate(l2, 0, (1 - e) * 230);
    translate(l3, 0, (1 - e) * 320);
    translate(mtn, 0, (1 - e) * 520);
    translate(f1, 0, (1 - e) * 140);
    translate(f2, 0, (1 - e) * 230);
    [f1, f2, f3].forEach(function (f, i) { f.setAttribute('opacity', (i === 2 ? .5 : .8) * (1 - night * .7)); });

    // Muñequito sobre el sendero: posición, dirección e inclinación de la pendiente
    var k = clamp((p - .06) / .76), d = k * L;
    var pt = trail.getPointAtLength(d), next = trail.getPointAtLength(Math.min(L, d + 3)), prev = trail.getPointAtLength(Math.max(0, d - 3));
    var dx = next.x - prev.x, dy = next.y - prev.y, dir = dx < 0 ? -1 : 1, tilt = Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI * .35;
    hiker.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') scale(' + hikerScale + ')');
    flip.setAttribute('transform', 'scale(' + dir + ' 1) rotate(' + (k >= 1 ? 0 : tilt).toFixed(1) + ')');
    lamp.setAttribute('opacity', night * .9);
    var offset = (L - d).toFixed(1);
    done.style.strokeDashoffset = offset;
    doneGlow.style.strokeDashoffset = offset;

    // Cima: bandera y celebración
    var fl = clamp((p - .82) / .06);
    flag.setAttribute('opacity', k >= 1 ? 1 : 0);
    translate(cloth, 0, (1 - fl) * 46);
    burst.setAttribute('opacity', fl >= 1 ? 1 : 0);
    money.style.opacity = clamp((p - .04) / .12);   // monedas y billetes al empezar a subir

    // Misión (izquierda) y Visión (derecha) entran deslizándose; en móvil Misión sale antes
    var mobile = window.innerWidth <= 760, W = window.innerWidth;
    var mi = ease(clamp((p - .18) / .08)), vi = ease(clamp((p - .40) / .08)), out = clamp((p - .72) / .05);
    var mo = mobile ? Math.max(out, clamp((p - .38) / .04)) : out;
    mvM.style.opacity = (mi * (1 - mo)).toFixed(3);
    mvM.style.transform = 'translate(' + (-(1 - mi) * W * .5).toFixed(1) + 'px,' + (-mo * 30).toFixed(1) + 'px)';
    mvV.style.opacity = (vi * (1 - out)).toFixed(3);
    mvV.style.transform = 'translate(' + ((1 - vi) * W * .5).toFixed(1) + 'px,' + (-out * 30).toFixed(1) + 'px)';

    var win = fl >= 1;
    if (win !== wasWin) { root.classList.toggle('vzf-win', win); wasWin = win; }
    var cheer = k >= 1 && fl >= 1;
    if (cheer !== wasCheer) { hiker.classList.toggle('vzf-cheer', cheer); wasCheer = cheer; }
  }

  /* ---------- Bucle: sigue al scroll con inercia ---------- */
  var target = 0, current = 0, running = false, lastTs = 0;
  function read() {
    var r = root.getBoundingClientRect();
    target = clamp(-r.top / (r.height - window.innerHeight));
  }
  function loop(ts) {
    var dt = lastTs ? Math.min(100, ts - lastTs) : 16.7;
    lastTs = ts;
    var diff = target - current;
    current += diff * (1 - Math.pow(1 - SMOOTHING, dt / 16.7));   // independiente de los FPS
    hiker.classList.toggle('vzf-walking', Math.abs(diff) > .0006 && current < .82 && !wasCheer);
    draw(current);
    if (Math.abs(diff) > .0001) requestAnimationFrame(loop);
    else { running = false; lastTs = 0; hiker.classList.remove('vzf-walking'); }
  }
  function kick() {
    read();
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  layout();
  window.addEventListener('resize', function () { layout(); draw(current); kick(); });
  window.addEventListener('scroll', kick, { passive: true });
  read();
  current = target;
  draw(current);
})();
