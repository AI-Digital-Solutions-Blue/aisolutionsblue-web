# AI Digital Solutions Blue

Landing en español construida con Astro, TypeScript, CSS propio y Canvas 2D. Utiliza los assets originales del proyecto. El contenido comercial vive en una sola página; las rutas legales se conservan por separado.

## Desarrollo local

```sh
npm install
npm run dev
```

Abrir http://127.0.0.1:4321. Astro 7 mantiene el servidor de desarrollo en segundo plano. Para detenerlo: `ASTRO_TELEMETRY_DISABLED=1 npx astro dev stop`.

Se incluye Node 22 como dependencia local de desarrollo porque el Node instalado en este equipo es anterior al requerido por una dependencia de Astro. Los scripts de npm utilizan automáticamente ese ejecutable local. El servidor de producción necesita Node **22.19 o superior**.

```sh
npm run check
npm test
npm run build
HOST=127.0.0.1 PORT=4322 npm run preview
```

## Formulario

El endpoint `POST /api/contact` utiliza Resend. Crear un archivo `.env` a partir de `.env.example` para desarrollo. En producción, configurar estas variables en el entorno del servidor:

- `RESEND_API_KEY`: clave privada de Resend.
- `CONTACT_FROM`: remitente perteneciente a un dominio verificado en Resend; por ejemplo `Blue <contacto@aisolutionsblue.com>` una vez verificado.
- `SITE_ORIGIN`: origen público exacto; por defecto `https://aisolutionsblue.com`. Para una vista previa de producción, configurar su origen real.

Los destinatarios se fijan exclusivamente en el servidor:

- alejandro.guerra@aisolutionsblue.com
- cristian.urien@aisolutionsblue.com
- pablo.gonzalez@siweb.es

El email del visitante se usa como Reply-To. Los datos se envían como texto, sin interpolarlos en HTML. Hay validación de servidor, límite de tamaño, comprobación de origen, campo antispam, protección contra doble envío y claves de idempotencia para reintentos. El limitador permite 5 solicitudes por cliente en 15 minutos y mantiene memoria acotada. Para varias réplicas, sustituirlo por un almacén compartido y configurar la dirección del cliente desde un proxy de confianza.

**Sin credenciales, el formulario devuelve un error controlado y ofrece contacto directo. Nunca muestra éxito de un envío real que no haya sido aceptado por el proveedor.** Se debe comprobar la entrega real a los tres destinatarios después de configurar el dominio de envío. La aceptación por Resend no garantiza la llegada a la bandeja de entrada.

No se han enviado emails durante el desarrollo.

## Contenido y assets

- `src/data/site.ts`: empresa y proyectos (también conserva el catálogo y las preguntas de la versión anterior).
- `src/components/`: cabecera, pie, escena del hero, proyectos y formulario.
- `src/styles/global.css`: estilos, responsive y movimiento reducido.
- `src/scripts/site.ts`: menú, galerías y formulario.
- `src/scripts/motion.ts`: retícula de puntos y presentación de producto ligada al scroll.
- `src/scripts/signal.ts`: luz que recorre la línea, respuesta de los nodos y halo ambiental de la sección azul.
- `docs/direccion-producto.md`: dirección visual aprobada que sustituye al brief anterior.
- `src/data/legal.json`: textos legales extraídos del sitio público.
- `public/assets/`: copias de los assets web; `aisolutionsblue/` conserva los originales intactos.

Los tres proyectos tienen la misma estructura y espacio. No se han añadido cifras, testimonios ni resultados inventados. El contacto público es marketing@aisolutionsblue.com; no hay enlace de reserva de reuniones.

## Publicación pendiente

El hosting y el presupuesto todavía no están definidos. Se entrega un build con adaptador Node independiente, sin contratar servicios ni cambiar el dominio. Si se elige otro entorno, sustituir el adaptador por el correspondiente.

Antes de reemplazar la web actual:

1. Configurar el proveedor y el dominio de email, comprobar la entrega y el Reply-To.
2. Configurar HTTPS y el origen de producción; conservar los registros MX del correo al cambiar DNS.
3. Revisar las páginas legales con la empresa, incluidos los destinatarios del formulario y el proveedor de correo.
4. La ruta original `/cancel-policy` devolvió 404 durante la revisión: se conserva una página de contacto para consultas sobre cancelaciones, pendiente de recibir las condiciones de la empresa.
5. Guardar una copia de la web anterior y verificar las rutas, metadatos y formulario en la vista previa de producción.

La web no carga analytics, cookies de marketing ni embeds de terceros. Las redes sociales se abren mediante enlaces. Si se incorporan herramientas de seguimiento, revisar su carga y la información de cookies.

## Accesibilidad y rendimiento

HTML semántico, enlaces por ancla, acordeones nativos, formularios etiquetados, estados anunciados, navegación por teclado, fuentes locales y preferencia de movimiento reducido. El contenido principal y los acordeones funcionan sin JavaScript. Las imágenes bajo el hero se cargan de forma diferida. El envío nativo del formulario dispone de una respuesta HTML alternativa.

## Dirección visual actual

Hero centrado con tipografía grande, retícula azul animada y los tres productos en primer plano. Una sección azul hielo, con luz difusa y una superficie translúcida, explica cómo ayudan la IA y la automatización, sin segmentar por tipo de negocio. Los proyectos conservan el mismo espacio y presentan capturas reales a gran escala.

El fondo se dibuja con Canvas 2D a un máximo de 30 actualizaciones por segundo en escritorio y 24 en móvil, y se detiene fuera de pantalla o cuando la pestaña está oculta. La matriz conserva su orden mientras cuatro concentraciones suaves de luz se desplazan, aparecen y se disuelven de forma independiente. Los puntos permanecen perfectamente alineados en filas y columnas. Solo varían su intensidad y tamaño, siguiendo campos continuos de luz; no hay desplazamientos individuales ni barrido direccional. Con `prefers-reduced-motion` se muestra estática desde el inicio. Las imágenes ya no se fijan durante el scroll. En móvil, las vistas previas del hero se recorren horizontalmente mediante scroll nativo.

No se añadieron dependencias de animación: estos efectos utilizan Canvas, Web Animations API y transformaciones CSS. El texto permanece visible desde el HTML inicial. Sin JavaScript, el menú y los acordeones siguen disponibles; se ocultan los controles que necesitarían scripts.

La fotografía de la sección de equipo es una imagen de contexto de trabajo del material original, no un retrato verificado del equipo.

## Edición resumida

Se retiraron el bloque de servicios desplegable, las preguntas frecuentes generales y los textos repetidos de principios/método. Las capacidades se resumen en la sección azul, cada proyecto tiene una sola descripción breve y se conserva el contacto completo. Estructura: inicio, soluciones, proyectos, equipo y contacto.

El formulario pregunta el área de interés (atención con IA, automatización, soluciones a medida u orientación). Las opciones se comparten entre interfaz y validación del servidor.

La sección azul incluye un destello con estela que recorre los tres nodos en ciclos de nueve segundos, con una pausa entre recorridos. El icono central representa procesos conectados. La animación se adapta a la línea vertical de móvil. No hay controles visibles de movimiento. Se detiene fuera de pantalla, con la pestaña oculta y con movimiento reducido.

## Vista previa pública

Publicada con Sites en https://blue-ai-digital-solutions-preview.siweb-4224.chatgpt.site, con acceso público sin depender del servidor local. El dominio comercial no se ha modificado. La copia estática y su manifiesto de alojamiento están en `public-preview/`, con repositorio independiente.

Esta copia conserva el diseño y las interacciones de la landing. El formulario está deshabilitado explícitamente y ofrece marketing@aisolutionsblue.com hasta configurar el servicio de envío. Para publicar cambios hay que regenerar esa copia desde el build actual y desplegar una nueva versión del mismo Site.
