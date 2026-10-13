# Blue — rediseño de octubre 2026

Dirección acordada con el usuario el 6 de octubre de 2026. Sustituye a `direccion-producto.md` cuando se implemente. Referencias: lyra.digital (efectos, flujo y estética) y lienzzo.com (qué se comunica).

## Posicionamiento

- **Qué es Blue:** un estudio que crea productos propios con IA y también soluciones de IA y software a medida para empresas. Los productos propios son la prueba de lo que sabe hacer.
- **Público:** pymes en crecimiento de España, de 5 a 200 empleados, que pierden tiempo en tareas repetitivas. Tono cercano y profesional, de tú.
- **Líneas de servicio:** son tres.
  1. Asistentes y agentes de IA: voz, WhatsApp, chat, atención y reservas 24/7.
  2. Automatización de procesos: documentos y flujos entre herramientas.
  3. Software y plataformas a medida.
- **No se ofrecen** webs ni marketing como servicio.

## Productos y casos

| Nombre | Relación | Presentación |
|---|---|---|
| Sygna | Producto propio | Gestión laboral |
| Tu Mesa Ya! | Producto propio | Reservas para restaurantes |
| Call Center Siweb | **Cliente** | Caso de éxito a medida, con el nombre real |
| Adscena | Producto propio | Disponible, con enlace a https://adscena.es/ |

Cada uno tendrá su propia página. No hay testimonios, cifras, logos ni fotos del equipo disponibles: **no se inventa ninguno**. Se dejan preparados, y ocultos, un hueco para un testimonio de Siweb y otro para el equipo, que se activarán cuando haya contenido real.

## Conversión

- **Acción principal:** «Contáctanos», que lleva al formulario de `/contacto` (cambio del 7 de octubre: se deja de hablar de «diagnóstico gratuito»).
- **Cómo se pide:** solo con el formulario por ahora, sin calendario de reservas. El formulario actual con Brevo se mantiene.

## Estructura

Portada con el recorrido completo, una página por producto o caso (4), contacto y las páginas legales. Solo en español, sin preparar otros idiomas.

## Color

Opción A: claro, con un único acento.

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#FFFFFF` | Dominante, alrededor del 70 % |
| Niebla | `#F3F6FB` | Secciones suaves |
| Tinta | `#0A1022` | Texto y capítulos oscuros, alrededor del 22 % |
| Gris | `#5B6780` | Texto secundario |
| Azul | `#2F5BFF` | Acento único (botones, enlaces, el punto), alrededor del 8 % |
| Azul hondo | `#0B1E5B` | Capítulos azules |
| Degradado | `#2F7BFF → #7B4DFF` | Solo en el logo y en momentos clave (la entrada y la llamada final) |

Los valores son la propuesta inicial. Se ajustarán al comprobar el contraste (AA) durante la implementación.

## Tipografía

Se mantienen Manrope para los titulares y DM Sans para el texto. El carácter lo dan la escala y el movimiento.

## Movimiento

Se hará con GSAP y ScrollTrigger. La retícula de puntos actual se retira. Hay cuatro momentos:

1. **Entrada con el punto:** el anillo de «.blue» late sobre la tinta, se expande y revela la página en blanco. Dura unos 1,5 s, se puede saltar y solo se reproduce en la primera visita de la sesión.
2. **Titulares que se revelan** línea a línea al hacer scroll.
3. **Productos fijados al scroll:** las cuatro pantallas pasan mientras la sección se mantiene fija.
4. **Casos de uso que se escriben**, al estilo de Lienzzo, con frases de lo que hace Blue.

Requisitos: una versión completa sin movimiento para `prefers-reduced-motion`; ningún texto depende de una animación para leerse; el rendimiento se mide en móvil antes de dar el trabajo por terminado.

## Revisión del 7 de octubre de 2026: mensaje para negocios locales

Tras hablar con su audiencia, el usuario redefine el público y el mensaje (detalle en `PRODUCT.md`):

- **Público:** dueños de negocios pequeños y medianos de servicios y atención al público. **No se nombran sectores ni industrias**; se habla de necesidades y situaciones cotidianas.
- **Posicionamiento:** Blue es la tecnología que hace dar el salto a un negocio; construye a medida lo que cada negocio necesita. Los productos son la prueba, no el catálogo.
- **Portada:** el titular habla del salto y no de la IA. Las figuras de partículas cuentan la historia: un pájaro (el negocio, vivo), una red neuronal (la tecnología de Blue) y una curva de crecimiento (el salto).
- **Panel fijado:** cada paso muestra una situación que el dueño reconoce y cómo la resuelve Blue, con un producto como prueba. El último paso es el caso a medida.
- **Tono visual:** portada en azul noche con bioluminiscencia (`tone="dark"`, reversible). Partículas de índigo a cian, sin violeta ni verde.
