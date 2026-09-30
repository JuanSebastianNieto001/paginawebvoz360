# Despliegue (Vercel)

- **Repositorio:** GitHub `JuanSebastianNieto001/paginawebvoz360`, rama `main`.
- **Producción:** <https://paginawebvoz360.vercel.app>
- **Proyecto Vercel:** `paginawebvoz360`. Preset "Other", sin build. Publica la carpeta `public/`, definida en `vercel.json` (`outputDirectory`).

Cada push a `main` publica automáticamente. Cada push a otra rama genera una vista previa con su propia URL, protegida con el inicio de sesión de Vercel.

## `vercel.json`

| Clave | Para qué |
|---|---|
| `outputDirectory: "public"` | Solo se publica `public/`; `docs/`, `tools/` y la configuración nunca quedan expuestos |
| `headers` → `/(.*)` | Cabeceras de seguridad para todas las rutas (ver abajo) |
| `headers` → `/assets/(.*)` | Imágenes, fuentes, CSS y JS se guardan en el navegador por 1 año (`immutable`). Por eso los CSS y JS llevan `?v=` y las imágenes nuevas usan nombres nuevos |

### Cabeceras de seguridad

| Cabecera | Efecto |
|---|---|
| `Content-Security-Policy` | Solo se cargan recursos del propio sitio; sin scripts en línea; formularios solo hacia el sitio y Formspree; la página no puede incrustarse en otro sitio |
| `X-Frame-Options: DENY` | Refuerza la protección contra incrustación (clickjacking) |
| `X-Content-Type-Options: nosniff` | El navegador no "adivina" tipos de archivo |
| `Referrer-Policy` | No se envía la URL completa a otros sitios |
| `Permissions-Policy` | Cámara, micrófono, ubicación y pagos deshabilitados |
| `Cross-Origin-Opener-Policy` | Aísla la ventana de otras páginas |
| `Strict-Transport-Security` | Siempre HTTPS (2 años, con subdominios) |

## Publicar un cambio

```bash
node tools/bump-version.js        # si cambió CSS o JS
git add -A && git commit -m "Descripción del cambio"
git push origin main              # o la rama del cambio, para tener vista previa
```

Comprueba después que el despliegue quedó en estado **Ready**:

```bash
npx vercel ls paginawebvoz360
```

## Deploys antiguos

Por decisión del proyecto se conservan solo el deploy actual y el anterior. El anterior sirve para volver atrás de inmediato ("Promote to Production" en Vercel). Los demás se eliminan:

```bash
npx vercel rm <url-del-deploy> --yes
```

El historial completo sigue en Git, así que cualquier versión anterior se puede volver a publicar.

## Volver a una versión anterior

- **Rápido:** en Vercel → Deployments → el deploy anterior → *Promote to Production*.
- **Definitivo:** `git revert <commit>` y push a `main`.
