# Verificación — 16 de septiembre de 2026

## Diseño actual

Se aplicó la dirección aprobada de hero centrado, retícula azul de puntos, sección azul profundo y presentaciones de producto a gran escala. Se conservaron los assets originales, los tres proyectos y la página comercial única en español.

## Comprobaciones realizadas

- Build de producción y comprobación de tipos: 0 errores, 0 avisos y 0 hints.
- Formato: `npm run format:check` correcto.
- 7 pruebas del formulario superadas: validación, destinatarios fijados, reintentos y limitador.
- Navegador: escritorio 1440 px, tablet 768 px y móvil 390 y 320 px; sin desbordamiento horizontal de la página. El carrusel de productos móvil tiene desplazamiento horizontal intencional.
- Menú móvil: abre, se cierra al navegar y responde a Escape devolviendo el foco al botón.
- Los acordeones de servicios se retiraron al resumir la página.
- Ejemplos por sector: cambio de consulta, acción y resultado; altura estable del panel en escritorio.
- Galerías: imagen, contador, texto alternativo y enlace para ampliar se actualizan juntos.
- Formulario vacío: foco en el primer campo obligatorio. Controles a 16 px en móvil.
- Los controles visibles de pausa se retiraron a petición del usuario.
- Móvil: movimiento del contenido desactivado. La retícula de fondo continúa animada a un máximo de 24 actualizaciones por segundo.
- Los tres capítulos de proyectos tienen la misma altura en escritorio (aproximadamente 951 px a 1440 × 1000) y la misma anchura de imagen.
- Sin errores de consola en la revisión.
- Revisión de contraste de textos sobre fondos planos: se detectaron y oscurecieron los separadores de los contadores. El extremo claro del título con degradado también se oscureció.

La revisión no sustituye una auditoría completa con lectores de pantalla. La preferencia `prefers-reduced-motion` se atiende tanto en CSS como en JavaScript; su lógica se revisó en código, sin emularla por separado en el navegador. Se comprobó la configuración de móvil, sin movimiento del contenido y con retícula animada. No se realizó la prueba de comprensión con una persona ajena al proyecto.

## Movimiento y rendimiento

- Canvas 2D a un máximo de 30 actualizaciones por segundo en escritorio y 24 en móvil; detenido fuera de pantalla y con la pestaña oculta.
- Variación leve de escala en las capturas de escritorio, sin fijarlas ni añadir recorrido de scroll. Sin texto oculto por animaciones.
- Sin dependencias adicionales de animación.
- JavaScript del cliente: 3976 bytes con gzip, aproximadamente 4,0 KB.
- CSS: 13075 bytes con gzip, aproximadamente 13,1 KB.
- Fuentes locales y carga diferida de las imágenes bajo el hero.

Los tamaños corresponden a archivos del build, no a una medición de Lighthouse o de rendimiento de usuarios reales.

Estas cifras de tamaño pertenecen a la revisión inicial, anterior a los ajustes de luz y retícula.

## Backend conservado

El endpoint y sus controles de origen, tamaño y formato no se modificaron en esta revisión visual. En la verificación anterior se comprobaron las respuestas 405, 403, 415, 400 y 413, las rutas públicas y el 404. El endpoint devuelve 503 controlado cuando falta el proveedor de correo. No se enviaron emails reales.

## Pendiente para publicación

- Elegir hosting y configurar el despliegue en el dominio existente.
- Configurar remitente verificado y clave de Resend; comprobar la entrega a los tres destinatarios.
- Recibir las condiciones de cancelación: el enlace original devolvía 404.
- Revisar los textos legales con la configuración final del correo.

La web pública no se ha sustituido. La vista previa funciona localmente en `http://127.0.0.1:4322/`.

## Verificación tras resumir el contenido

Build sin errores. Cinco secciones principales, enlaces internos válidos y sin desbordamiento horizontal a 1440 y 320 px. Control de pausa y navegación móvil correctos; sin errores de consola. Se comprobó visualmente el fondo al inicio de la carga y después de su aparición. No se modificó el backend del formulario.

## Ajuste de enfoque general

Se retiró el selector por sectores y el ejemplo de reserva. Se conservó el título principal. La sección de soluciones explica atención inteligente, procesos conectados y tiempo para avanzar. El formulario ahora valida un área de interés (`interest`) en lugar de un sector. Build y 7 pruebas correctos; selector ausente en el navegador, opciones del formulario comprobadas y sin desbordamiento a 320 px.

## Luz de la sección azul

Icono central sustituido por conexiones. Se comprobó el desplazamiento horizontal y vertical del destello, la pausa (posición idéntica antes/después) y la detención fuera de pantalla. Sin desbordamiento a 1440 y 390 px. Build con 0 errores, avisos y hints. Movimiento reducido atendido por JavaScript y CSS; sin cambios en el formulario ni dependencias nuevas.

## Retícula orgánica de la hero

Se sustituyó el barrido direccional por cuatro concentraciones de luz independientes, con cambios suaves de intensidad, tamaño y desplazamientos de hasta 5,5 px por eje. Tras la revisión del usuario, se duplicó la velocidad de evolución y se aumentaron el tamaño y el contraste de los puntos activos para que el movimiento sea más perceptible. Adaptación visual inspirada en la captura aportada; no se obtuvo una especificación oficial de la animación de ChatGPT. Revisada en escritorio de 1440 px y móvil de 390 px; botón de pausa y reanudación disponible en móvil, sin desbordamiento horizontal ni errores de consola. Build con 0 errores, avisos y hints. Se conservaron el título y el efecto de luz de la sección azul.

## Retirada de controles de movimiento

Se eliminaron los botones «Pausar movimiento» y «Pausar luz», sus estilos y sus eventos. Las comprobaciones de botones descritas en revisiones anteriores corresponden a la versión previa. Se conserva la adaptación automática a movimiento reducido y la detención fuera de pantalla o con la pestaña oculta.

## Alineación de la retícula

Se fijaron las coordenadas de los puntos para conservar filas y columnas rectas. Se eliminaron las fases aleatorias por punto y la aparición escalonada; el brillo y el tamaño responden a campos continuos compartidos. Se mantiene la velocidad aprobada de las concentraciones de luz.

## Acabado luminoso de soluciones

La sección de soluciones utiliza ahora azul hielo, luz ambiental difusa, una superficie translúcida y nodos claros. El destello mantiene su recorrido horizontal en escritorio y vertical en móvil. Comprobado a 1440 y 390 px, sin desbordamiento ni errores de consola. Build: 0 errores, avisos y hints.

## Experimento de profundidad sutil

Retícula proyectada como un plano rígido con inclinación mínima, reacción amortiguada al cursor y sombreado de los puntos generado una sola vez en Canvas. Sin desplazamientos independientes. Se mantiene el ritmo aprobado, las pausas fuera de pantalla y la preferencia de movimiento reducido. Build sin errores; revisión local a 1440 y 390 px sin desbordamiento ni errores de consola.

Reversión: `.design-backups/hero-before-depth/motion.ts` conserva el código previo; su README registra la versión pública anterior. `DEPTH_EXPERIMENT = false` también permite recuperar el render plano.
