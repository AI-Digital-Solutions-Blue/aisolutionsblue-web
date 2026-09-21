# Blue — producto, escala y movimiento

Dirección aprobada por el usuario tras compartir las referencias de Apple, SpaceX y una captura con retícula de puntos. Sustituye a `direccion-visual.md`. Implementación completada el 16 de septiembre de 2026.

## Decisiones

- Hero centrado y tipografía de gran escala. El subtítulo explica IA y automatización para negocios.
- Blanco predominante, azul de marca y un capítulo azul profundo para mostrar ejemplos de uso.
- Retícula de puntos azul claro con ondas lentas y respuesta suave al cursor.
- Capturas originales de Sygna, Tu Mesa Ya! y Call Center Siweb. Igual estructura y espacio en sus secciones.
- Presentación de producto con variación leve de escala, sin tramos extra de posición fija tras la petición de acortar la página.
- Móvil con scroll natural, entrada de la retícula durante unos dos segundos y reposo posterior; vistas previas grandes con recorrido horizontal.
- Botón para pausar el movimiento; respeto de movimiento reducido. El texto no depende de animaciones.

## Alcance que se conserva

Una página comercial en español, público de negocios locales y emprendimientos, contacto y Calendly existentes, tres proyectos activos. Destinatarios del formulario fijados en el servidor según lo indicado por el usuario. Rutas legales auxiliares conservadas.

## Implementación

Astro y TypeScript existentes. CSS, Canvas 2D y Web Animations API para el movimiento. No se necesitan nuevas librerías, vídeo pesado ni una escena WebGL para este efecto. El fondo detiene su bucle fuera de pantalla y con la pestaña oculta. Los assets originales permanecen intactos.

## Pendientes externos

Hosting, configuración del proveedor de correo y comprobación de entrega real. La publicación en el dominio no se ha realizado. Se recomienda validar la comprensión del sitio con una persona ajena al proyecto; esa prueba no se ha realizado.

## Ajuste posterior solicitado

Se resumió la página para eliminar información repetida: cinco bloques principales y una descripción por proyecto. La retícula tiene una aparición diagonal progresiva, seguida de una onda azul perceptible en escritorio. El texto y las acciones no esperan a esa animación.
