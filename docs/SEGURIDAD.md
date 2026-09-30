# Seguridad de la información (ISO/IEC 27001:2022)

El sitio web forma parte del alcance del SGSI de VOZ360. Este documento resume los controles del Anexo A que aplican a la web y cómo se cumplen. **No incluir aquí información sensible**: el repositorio es público.

## Controles implementados

| Control | Cómo se cumple en el sitio |
|---|---|
| A.5.1 · Cláusula 5.2 Políticas | `politica-seguridad.html`, enlazada desde el footer |
| A.5.34 Privacidad y datos personales | `politica-datos.html` (Ley 1581 de 2012). Casilla obligatoria de autorización en ambos formularios. Sin cookies, píxeles ni analítica de terceros |
| A.5.24–A.5.26 Incidentes | Enlace "Reportar un incidente" en el footer y `/.well-known/security.txt` (RFC 9116) |
| A.5.31 Requisitos legales | NIT y domicilio publicados; sin afirmaciones de seguridad no demostrables |
| A.7.7 Pantalla y escritorio limpios | Protocolo de revisión de fotos ([CONTENIDO.md](CONTENIDO.md#fotos)) y herramienta de desenfoque (`tools/blur-regions.js`). Fotos publicadas sin metadatos |
| A.8.9 Configuración · A.8.26 Seguridad de aplicaciones | Cabeceras de seguridad en `vercel.json` (CSP estricta sin scripts en línea, anti-clickjacking, HSTS, etc.). Ver [DESPLIEGUE.md](DESPLIEGUE.md) |
| A.8.24 Criptografía | Solo HTTPS, con HSTS de 2 años |
| A.8.4 Acceso al código · A.5.12 Clasificación | Solo se publica `public/`; el material original está excluido por `.gitignore` |
| A.8.25–A.8.29 Desarrollo seguro y pruebas | Convenciones y flujo con vista previa en [DESARROLLO.md](DESARROLLO.md); servidor local con las mismas cabeceras que producción |
| A.8.32 Gestión de cambios | Historial de Git con mensajes descriptivos; vista previa y aprobación antes de producción; deploy anterior disponible para volver atrás |

## Pendientes (responsabilidad de VOZ360)

- [ ] **Repositorio de GitHub privado**, o historial depurado. El historial contiene versiones antiguas de fotos que no deben ser públicas (ver el reporte interno de riesgos en fotos, que está fuera de este repositorio).
- [ ] Cuentas de GitHub y Vercel **corporativas**, con verificación en dos pasos y registro de accesos (A.5.18, A.8.2).
- [ ] Crear los buzones `seguridad@voz360.co` y `datospersonales@voz360.co`, o cambiarlos en la web.
- [ ] **Aprobación de las políticas** por la Dirección y revisión jurídica de la política de datos.
- [ ] **Autorizaciones de uso de imagen** de todas las personas que aparecen en fotos y reels. Autorización de los clientes cuya marca aparezca.
- [ ] Registrar como proveedores en el SGSI: Vercel, GitHub, el proveedor de formularios y las herramientas de IA usadas en el desarrollo (A.5.19–A.5.23).
- [ ] Procedimiento de **uso de IA en el desarrollo**, aprobado por la Dirección (A.5.10, A.8.30).
- [ ] Monitoreo de disponibilidad del sitio con alertas (A.8.16).
- [ ] Revisión anual de vulnerabilidades del sitio (A.8.8).
- [ ] Dominio corporativo (p. ej. `www.voz360.co`). Al tenerlo, actualizar `Canonical` y `Policy` en `security.txt`.
- [ ] Al conectar los formularios: proveedor con acuerdo de tratamiento de datos, acceso restringido a las respuestas y plazos de conservación (12 meses para aspirantes no seleccionados).

## Si se detecta un problema

1. Retirar de inmediato el contenido afectado (commit + push; verificar el deploy).
2. Si hay datos personales expuestos: informar al responsable del SGSI y al área jurídica, que evalúan el reporte a la SIC (15 días hábiles) y el aviso al cliente afectado.
3. Registrar el incidente en el SGSI con la evidencia, las acciones y las lecciones aprendidas.
