/* ==========================================================================
   QUIÉNES SOMOS — onda de audio y cronómetro de la llamada "en vivo"
   Genera las 28 barras de la onda con duración y retraso al azar (para que no
   se muevan al unísono) y hace correr el cronómetro de la tarjeta de la agente.
   Estilos: css/sections/nosotros.css
   ========================================================================== */
(function () {
  'use strict';

  var BARS = 28;
  var wave = document.getElementById('qs-wave');
  if (wave) {
    for (var i = 0; i < BARS; i++) {
      var bar = document.createElement('i');
      bar.style.animationDelay = (-Math.random() * 1.1).toFixed(2) + 's';
      bar.style.animationDuration = (0.7 + Math.random() * 0.8).toFixed(2) + 's';
      wave.appendChild(bar);
    }
  }

  var timer = document.getElementById('qs-timer');
  if (timer) {
    var seconds = 134;   // la llamada "empieza" en 02:14
    var pad = function (n) { return String(n).padStart(2, '0'); };
    setInterval(function () {
      seconds++;
      timer.textContent = pad(Math.floor(seconds / 60)) + ':' + pad(seconds % 60);
    }, 1000);
  }
})();
