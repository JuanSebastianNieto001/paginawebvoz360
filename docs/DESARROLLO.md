# Desarrollo local y herramientas

Requisitos: [Node.js](https://nodejs.org) 18 o superior y Git.

## Ver el sitio en local

```bash
node tools/serve.js          # http://localhost:8080  (otro puerto: node tools/serve.js 3000)
```

El servidor aplica las **mismas cabeceras de seguridad** de `vercel.json`, así que cualquier recurso bloqueado por la Content-Security-Policy aparece también en local (en la consola del navegador).

## Herramientas (`tools/`)

Instala una vez sus dependencias (solo `sharp`, para imágenes):

```bash
cd tools && npm install
```

| Comando | Qué hace | Cuándo |
|---|---|---|
| `node tools/bump-version.js` | Cambia el `?v=` de todos los CSS/JS en los HTML para que los navegadores descarguen la versión nueva | Antes de cada commit que toque CSS o JS |
| `node tools/gallery-thumbs.js` | Crea las miniaturas desenfocadas de `galeria/blur/` y borra las que sobran | Al agregar, cambiar o quitar fotos de la galería |
| `node tools/blur-regions.js entrada.jpg salida.jpg "x0,y0,x1,y1;…"` | Desenfoca zonas de una foto (en % del ancho y alto). El resultado no conserva metadatos (GPS, modelo del teléfono) | Antes de publicar fotos con pantallas o documentos |

Ejemplo de `blur-regions.js`: `"50,49,64,60"` desenfoca el rectángulo que va del 50 % al 64 % del ancho y del 49 % al 60 % del alto. Separa varias zonas con `;`.

## Flujo de trabajo recomendado

1. Crea una rama: `git switch -c cambio/descripcion-corta`.
2. Haz el cambio y pruébalo en local: escritorio, tablet (~800 px) y celular (~390 px). Revisa la consola del navegador (sin errores ni avisos de CSP).
3. Si tocaste CSS o JS: `node tools/bump-version.js`.
4. Commit con un mensaje claro y push de la rama. Vercel genera una **vista previa** con URL propia.
5. Una persona responsable revisa la vista previa y aprueba. Luego se une a `main`, que publica en producción.

Este flujo es la evidencia de gestión de cambios que pide ISO/IEC 27001 (A.8.32) y separa el entorno de pruebas del de producción (A.8.31).

## Convenciones de código

- **Idioma:** comentarios, textos y nombres de archivo en español. Los nombres de variables y funciones pueden ir en inglés si son términos técnicos (`open`, `close`, `render`).
- **CSS:** colores y tipografías siempre desde `base/tokens.css`; un archivo por sección; las reglas `@media` al final de su archivo. Animar solo `transform` y `opacity`.
- **JS:** un módulo por sección con `'use strict'`, sin variables globales; constantes de ajuste en MAYÚSCULAS al inicio del módulo; nada de `innerHTML` con datos del usuario.
- **HTML:** sin estilos ni scripts en línea nuevos (la CSP no los permite para scripts). Los `style="--delay:…"` de las animaciones de entrada sí se permiten.
- `.editorconfig` define codificación UTF-8, finales de línea LF y sangría de 2 espacios.
