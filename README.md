# VOZ360 — Sitio web

Sitio web institucional de **VOZ360**, contact center omnicanal (Manizales, Colombia).
Es un sitio estático: HTML, CSS y JavaScript, sin frameworks ni dependencias en producción.
Se publica en Vercel en <https://paginawebvoz360.vercel.app>. Cada push a `main` publica una versión nueva.

## Estructura

```
paginawebvoz360/
├── public/                     ← lo único que se publica (Vercel: outputDirectory)
│   ├── index.html              página principal
│   ├── politica-datos.html     política de tratamiento de datos de DALMARU – VOZ360 (Ley 1581)
│   ├── politica-seguridad.html política de seguridad de la información (ISO 27001)
│   ├── favicon.ico
│   ├── .well-known/security.txt  contacto para reportar vulnerabilidades
│   └── assets/
│       ├── css/
│       │   ├── base/           fuentes, tokens de diseño, base y animaciones
│       │   ├── layout/         header y footer
│       │   ├── components/     botones, formularios y bot
│       │   ├── sections/       una hoja por sección de la página
│       │   └── legal.css       estilos de las páginas legales
│       ├── js/
│       │   ├── head.js         se ejecuta antes de pintar la página
│       │   ├── config.js       ⚙ formularios, WhatsApp e Instagram
│       │   └── modules/        un módulo por sección o componente
│       ├── fonts/              Sora y Audiowide (alojadas aquí mismo)
│       ├── img/                marca/, portada/, galeria/ (+ blur/), final/
│       └── video/              intro y reels
├── tools/                      scripts de mantenimiento (no se publican)
├── docs/                       documentación del proyecto
├── vercel.json                 publicación y cabeceras de seguridad
├── .editorconfig · .gitattributes · .gitignore
└── README.md
```

## Uso rápido

| Quiero… | Ver |
|---|---|
| Cambiar textos, fotos, correos o conectar los formularios | [docs/CONTENIDO.md](docs/CONTENIDO.md) |
| Entender cómo está hecho (secciones, CSS, JS, rendimiento) | [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) |
| Probar en local y usar las herramientas | [docs/DESARROLLO.md](docs/DESARROLLO.md) |
| Publicar en Vercel | [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) |
| Ver los controles de seguridad (ISO/IEC 27001) y lo pendiente | [docs/SEGURIDAD.md](docs/SEGURIDAD.md) |
| Ver el historial de cambios | [docs/CHANGELOG.md](docs/CHANGELOG.md) |

Para ver el sitio en local, con las mismas cabeceras de seguridad que en producción:

```bash
node tools/serve.js        # → http://localhost:8080
```

## Reglas del proyecto

1. **Ninguna foto o video se publica sin revisión previa.** No deben verse pantallas, documentos, datos de clientes ni marcas de terceros (ISO/IEC 27001 A.7.7). Ver [docs/CONTENIDO.md](docs/CONTENIDO.md#fotos).
2. **El material original no entra al repositorio.** Las fotos sin editar, los videos en bruto, el manual de marca y los prototipos van fuera del proyecto (ya lo impide el `.gitignore`).
3. **Cambios con versión nueva.** Si cambias CSS o JS, ejecuta `node tools/bump-version.js` antes de hacer commit.
4. **Todo cambio queda en el historial** con un mensaje que explique qué y por qué.
