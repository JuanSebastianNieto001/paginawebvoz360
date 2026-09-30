/* ==========================================================================
   FORMULARIOS — Contáctanos (#contact-form), Trabaja con nosotros (#job-form)
   y PQRS y sugerencias (#pqrs-form)
   1) Ayudas del formulario de postulación: fechas con calendario nativo
      (se envían como dd/mm/aaaa), "mi WhatsApp es el mismo número",
      documento y teléfonos solo con números.
   2) Ayudas del formulario de PQRS: descripción de cada tipo, modo anónimo
      (desactiva los datos personales y la autorización) y número de radicado.
   3) Envío: valida (incluida la casilla de autorización de datos), y envía por
      POST al servicio configurado en config.js. Sin servicio configurado no se
      envía nada y se muestra un aviso.
   Estilos: css/components/forms.css
   ========================================================================== */
(function () {
  'use strict';

  var config = (window.VOZ360 && window.VOZ360.config) || {};
  var DATE_HINT = 'Día / mes / año';

  /* ---------- 1. Formulario de postulación ---------- */
  var jobForm = document.getElementById('job-form');
  if (jobForm) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var today = new Date();
    var todayIso = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    var birth = document.getElementById('j-nac');
    var issued = document.getElementById('j-exp');

    // La expedición del documento no puede ser anterior al nacimiento
    var checkDates = function () {
      issued.setCustomValidity(birth.value && issued.value && issued.value <= birth.value
        ? 'La fecha de expedición debe ser posterior a la de nacimiento.' : '');
    };

    // Calendario nativo; el valor enviado (campo oculto) y la ayuda van en día/mes/año
    jobForm.querySelectorAll('input[type="date"]').forEach(function (input) {
      input.max = todayIso;
      var hidden = document.getElementById(input.getAttribute('data-date-for'));
      var hint = jobForm.querySelector('[data-hint-for="' + input.id + '"]');
      input.addEventListener('change', function () {
        if (!input.value) { hidden.value = ''; hint.textContent = DATE_HINT; hint.classList.remove('is-set'); return; }
        var p = input.value.split('-');                 // aaaa-mm-dd
        hidden.value = p[2] + '/' + p[1] + '/' + p[0];  // dd/mm/aaaa
        hint.textContent = 'Seleccionaste: ' + hidden.value;
        hint.classList.add('is-set');
        checkDates();
      });
    });

    // "Mi WhatsApp es el mismo número de contacto"
    var tel = document.getElementById('j-tel');
    var wa = document.getElementById('j-wa');
    var same = document.getElementById('j-wa-same');
    var syncWa = function () { if (same.checked) wa.value = tel.value; wa.readOnly = same.checked; };
    same.addEventListener('change', syncWa);
    tel.addEventListener('input', syncWa);

    // Documento: solo números (salvo pasaporte, PPT y PEP, que pueden llevar letras)
    document.getElementById('j-doc').addEventListener('input', function (e) {
      var type = document.getElementById('j-tipo').value;
      if (type !== 'Pasaporte' && type !== 'PPT' && type !== 'PEP') e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    // Teléfonos: números, espacios y "+"
    [tel, wa].forEach(function (input) {
      input.addEventListener('input', function () { input.value = input.value.replace(/[^0-9+ ]/g, ''); });
    });
  }

  /* ---------- 2. Formulario de PQRS ---------- */
  var pqrsForm = document.getElementById('pqrs-form');
  var TYPE_HINT = 'Elige el tipo que mejor describe tu solicitud.';

  // Radicado legible y único: PQRS-AAAAMMDD-XXXX (4 caracteres aleatorios, sin 0/O ni 1/I)
  function newRadicado() {
    var d = new Date(), chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', code = '';
    var rnd = new Uint8Array(4);
    window.crypto.getRandomValues(rnd);
    rnd.forEach(function (n) { code += chars[n % chars.length]; });
    return 'PQRS-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + code;
  }

  var syncAnonymous = function () {};
  if (pqrsForm) {
    var typeHint = document.getElementById('p-tipo-hint');
    var anonymous = document.getElementById('p-anonimo');
    var personal = pqrsForm.querySelectorAll('#p-datos input, #p-autoriza input');

    // Al elegir un tipo se explica en qué consiste
    pqrsForm.querySelectorAll('input[name="tipo"]').forEach(function (radio) {
      radio.addEventListener('change', function () { typeHint.textContent = radio.getAttribute('data-hint'); });
    });

    // Anónima: los datos personales se vacían y desactivan (no se validan ni se envían)
    syncAnonymous = function () {
      personal.forEach(function (input) {
        input.disabled = anonymous.checked;
        if (!anonymous.checked) return;
        if (input.type === 'checkbox') input.checked = false; else input.value = '';
      });
      pqrsForm.classList.toggle('is-anonymous', anonymous.checked);
    };
    anonymous.addEventListener('change', syncAnonymous);

    document.getElementById('p-tel').addEventListener('input', function (e) { e.target.value = e.target.value.replace(/[^0-9+ ]/g, ''); });
  }

  /* ---------- 3. Envío ---------- */
  var MESSAGES = {
    unavailableJob: 'El formulario aún no está disponible. Puedes enviar tu hoja de vida a seleccion@voz360.co.',
    unavailablePqrs: 'El formulario aún no está disponible. Mientras tanto, llámanos al 314 618 3746.',
    unavailable: 'El formulario aún no está disponible. Inténtalo de nuevo más tarde.',
    sending: 'Enviando…',
    failed: 'No pudimos enviar el formulario. Inténtalo de nuevo en unos minutos.'
  };

  document.querySelectorAll('#contact-form, #job-form, #pqrs-form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var submit = form.querySelector('.form-submit');
    var endpoint = config[form.getAttribute('data-endpoint')] || '';   // FORM_ENDPOINT, JOBS_ENDPOINT o PQRS_ENDPOINT

    function setStatus(msg, type) {
      status.textContent = msg;
      status.className = 'form-status' + (type ? ' is-' + type : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('was-validated');   // desde ahora se marcan los campos incompletos

      if (!form.checkValidity()) {
        var firstInvalid = form.querySelector(':invalid:not(fieldset)');
        // Mensaje propio solo para la fecha de expedición inválida; el resto usa el genérico
        var custom = firstInvalid && firstInvalid.id === 'j-exp' && firstInvalid.value ? firstInvalid.validationMessage : '';
        setStatus(custom || form.getAttribute('data-required-msg'), 'error');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!endpoint) {
        setStatus(form.id === 'job-form' ? MESSAGES.unavailableJob : form.id === 'pqrs-form' ? MESSAGES.unavailablePqrs : MESSAGES.unavailable, 'error');
        return;
      }

      // PQRS: número de radicado que se envía y se le muestra a la persona
      var radicado = form === pqrsForm ? newRadicado() : '';
      if (radicado) document.getElementById('p-radicado').value = radicado;

      submit.disabled = true;
      setStatus(MESSAGES.sending);

      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          form.classList.remove('was-validated');
          form.querySelectorAll('[data-hint-for]').forEach(function (h) { h.textContent = DATE_HINT; h.classList.remove('is-set'); });
          if (form === pqrsForm) { syncAnonymous(); document.getElementById('p-tipo-hint').textContent = TYPE_HINT; }
          setStatus(form.getAttribute('data-ok-msg').replace('{radicado}', radicado), 'ok');
        })
        .catch(function () { setStatus(MESSAGES.failed, 'error'); })
        .then(function () { submit.disabled = false; });
    });
  });
})();
