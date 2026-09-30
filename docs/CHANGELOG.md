# Historial de cambios

Resumen por versión. El detalle completo está en el historial de Git (`git log`).

## 2026-09-30 — Reorganización del proyecto
- Estructura profesional: `public/` (lo publicado), `tools/`, `docs/`. Vercel publica solo `public/`.
- CSS dividido en 18 hojas (base, layout, components, sections) en el mismo orden de cascada. Se verificó que el resultado visual es idéntico comparando los estilos calculados de todos los elementos en 4 tamaños de pantalla.
- JavaScript dividido en `config.js` y 13 módulos documentados.
- Eliminado: estilos y animaciones sin uso, reglas duplicadas, código de funciones retiradas (bloqueo de scroll en la montaña, variante de botón sin uso, banderas de "movimiento reducido" que ya no aplicaban).
- Corregido: en tablet y celular, las barras animadas de la ilustración de Tecnología quedaban fuera de lugar.
- Herramientas nuevas: servidor local con cabeceras de producción, versión de CSS/JS, miniaturas de galería y desenfoque de zonas en fotos.
- Retiradas de la web las fotos con información sensible visible. La portada usa ahora una foto del equipo.
- Portada en 2560×1920 (reescalada y enfocada desde el original de WhatsApp de 1280×960) para que no se vea pixelada en pantallas grandes.
- Material original (fotos sin editar, prototipos, manual de marca) movido fuera del repositorio.

## 2026-09-29 — Seguridad de la información (ISO/IEC 27001)
- Políticas de tratamiento de datos y de seguridad de la información. Autorización de datos en los formularios.
- Cabeceras de seguridad (CSP, anti-clickjacking, etc.) y `security.txt`.
- Fotos con pantallas y documentos desenfocadas. NIT y dirección (Manizales) en el footer y las políticas.
- Rendimiento: Tecnología sin desenfoque en vivo; onda de audio sin recalcular el diseño; animaciones pausadas fuera de pantalla.

## 2026-09-28 — Rediseño
- Home con intro, portada, transición de nubes, Quiénes somos, galería, servicios, tecnología, Instagram, final con montaña y bot de contacto.
- Tipografías y colores del manual de marca. Optimización de nubes, galería y montaña para equipos modestos.
