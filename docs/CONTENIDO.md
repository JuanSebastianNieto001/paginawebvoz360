# Editar contenidos

Guía para cambiar textos, fotos y datos sin tocar la lógica del sitio. Después de cualquier cambio, pruébalo en local (`node tools/serve.js`) antes de publicar.

## Configuración (`public/assets/js/config.js`)

| Dato | Para qué | Estado |
|---|---|---|
| `FORM_ENDPOINT` | URL del servicio que recibe el formulario **Contáctanos** | ⏳ vacío |
| `JOBS_ENDPOINT` | URL del servicio que recibe **Trabaja con nosotros** | ⏳ vacío |
| `WHATSAPP_NUMBER` | Número del WhatsApp del bot, solo dígitos con indicativo (ej. `573001234567`) | ⏳ vacío |
| `WHATSAPP_TEXT` | Mensaje inicial del chat de WhatsApp | listo |
| `INSTAGRAM_URL` | Perfil de Instagram | listo |

> ⚠ **Formularios:** si el servicio no es Formspree, hay que agregar su dominio a `connect-src` y `form-action` de la `Content-Security-Policy` en `vercel.json`. Si no se hace, el navegador bloquea el envío. Usa un proveedor que firme un acuerdo de tratamiento de datos (ISO 27001 A.5.19–A.5.23).

## Textos

Casi todos los textos están directamente en `public/index.html`, en la sección correspondiente (busca el comentario `<!-- ====== N. …`).

| Texto | Dónde |
|---|---|
| Ventana de cada tarjeta de Tecnología | `DATA` en `public/assets/js/modules/tecnologia.js` |
| Respuestas de Preguntas frecuentes | `<template id="faq-a-N">` al final del bot en `index.html` (las preguntas son los botones `.bot-chip`) |
| Mensajes de los formularios | atributos `data-required-msg` y `data-ok-msg` de cada `<form>`; avisos en `MESSAGES` de `modules/forms.js` |
| Datos de la empresa (NIT, dirección) | footer de `index.html` y sección 1 de `politica-datos.html` |
| Políticas | `politica-datos.html` y `politica-seguridad.html`. La de seguridad es el texto aprobado por la Gerencia: solo se cambia con una nueva versión aprobada (actualizar versión y fechas) |

Pendientes de contenido:
- **Teléfono** de la empresa: agregarlo al footer y a `politica-datos.html` (sección 1).
- **Cifras de Instagram** (`[N]` publicaciones, seguidores y seguidos) en la sección Instagram.
- **Video del teléfono inclinado** (Instagram): instrucciones en el comentario del HTML, sección 7.

## Fotos

### Antes de publicar cualquier foto o video (obligatorio)

Revisa el archivo **a resolución completa** y confirma que **no** se vea nada de esto:

- [ ] Pantallas con sistemas, datos de clientes, correos o consolas de administración
- [ ] Documentos, guiones o notas pegados en puestos o escritorios
- [ ] Carnés, contraseñas, papeles con nombres o números
- [ ] Marcas o publicidad de clientes (p. ej. Claro), salvo autorización escrita
- [ ] Personas sin **autorización de uso de imagen** firmada

Si algo aparece, desenfócalo con `tools/blur-regions.js` (ver [DESARROLLO.md](DESARROLLO.md)) o descarta la foto. Controles ISO/IEC 27001 A.7.7, A.5.34 y Ley 1581 de 2012.

### Galería

1. Guarda la foto en `public/assets/img/galeria/`, con un nombre descriptivo en minúsculas y guiones (ej. `sala-capacitacion.jpg`). Tamaño recomendado: 1050×1400 (vertical) o 1280×960, en JPG de calidad 80–85.
2. Genera su miniatura desenfocada: `cd tools && node gallery-thumbs.js`.
3. Agrega una línea `<figure class="gallery-item">…</figure>` en la sección 4 de `index.html` con su `alt` y su leyenda (`figcaption`).

### Portada

`public/assets/img/portada/equipo-hd.jpg`. Si la cambias, usa un **nombre de archivo nuevo** y actualízalo en el `<img class="hero-img">` y en `<meta property="og:image">`. Las imágenes se guardan en la memoria del navegador por un año, así que un nombre nuevo garantiza que todos vean la foto nueva.

### Reels (Instagram)

Videos en `public/assets/video/reels/` en MP4 (H.264), vertical 9:16, de máximo ~2 MB, con una imagen de portada (`poster`) en JPG.
