# VOZ360 — Sitio web

Sitio estático (HTML + CSS + JS, sin dependencias) del rediseño del home de VOZ360.

```
index.html        Página principal
css/styles.css    Estilos (escritorio + tablet + móvil)
js/main.js        Animaciones de scroll, carrusel, FAQ, menú móvil y formulario
assets/           Imágenes, fuentes y favicon
```

## Ver en local

Abre `index.html` en el navegador, o sirve la carpeta: `npx serve .`

## Desplegar en Vercel

1. En Vercel: **Add New → Project** e importa este repositorio de GitHub.
2. Framework preset: **Other**. Sin comando de build; directorio de salida: la raíz.
3. **Deploy**. Cada push a `main` vuelve a publicar el sitio.

## Pendientes de contenido

- Formularios del bot: pega la URL de tu servicio de formularios (p. ej. Formspree) en `FORM_ENDPOINT` (Contáctanos) y `JOBS_ENDPOINT` (Trabaja con nosotros) dentro de `js/main.js`.
- Reemplazar los marcadores `[VALOR SLA]`, `[VALOR CSAT]`, `[VALOR NPS]`, `[CORREO DE SELECCIÓN]` y `[TELÉFONO]` (pendiente: agregarlo al footer y a politica-datos.html) en `index.html`.
