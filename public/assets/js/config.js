/* ==========================================================================
   CONFIGURACIÓN DEL SITIO
   Único archivo que hay que tocar para conectar servicios externos.
   Lo leen modules/forms.js (formularios) y modules/bot.js (WhatsApp).
   ========================================================================== */
window.VOZ360 = window.VOZ360 || {};

window.VOZ360.config = {
  /* Formularios: URL del servicio que recibe los datos (p. ej. Formspree:
     https://formspree.io/f/xxxxxxx). Mientras esté vacía, el formulario no
     envía nada y muestra un aviso.
     ⚠ Si se usa un proveedor distinto de Formspree, hay que añadir su dominio
     a connect-src y form-action de la Content-Security-Policy en vercel.json. */
  FORM_ENDPOINT: '',   // Contáctanos
  JOBS_ENDPOINT: '',   // Trabaja con nosotros (postulaciones)

  /* Postulaciones por WhatsApp: si JOBS_ENDPOINT está vacío y hay número aquí,
     al enviar el formulario se abre WhatsApp con los datos ya escritos para
     este número (la persona revisa, envía y adjunta su hoja de vida). */
  JOBS_WHATSAPP: '573146183746',
  PQRS_ENDPOINT: '',   // PQRS y sugerencias

  /* WhatsApp del bot: número con indicativo, solo dígitos (ej. '573001234567').
     Vacío = el bot avisa que el canal estará disponible pronto. */
  WHATSAPP_NUMBER: '573146183746',
  WHATSAPP_TEXT: 'Hola VOZ360, quiero más información.',

  /* Perfil de Instagram (se usa en avisos del bot) */
  INSTAGRAM_URL: 'https://www.instagram.com/voz360_contact_center/'
};
