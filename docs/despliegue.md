# Despliegue

La web se publica con Vercel, en el proyecto `aisolutionsblue-web` de la cuenta
de Vercel de AI Digital Solutions Blue. El código vive en
`AI-Digital-Solutions-Blue/aisolutionsblue-web`.

## Dos entornos, dos ramas

| Entorno | Rama | URL |
| --- | --- | --- |
| Producción | `main` | `aisolutionsblue.com` (pendiente de DNS) y `aisolutionsblue-web.vercel.app` |
| Staging | `staging` | URL fija de la rama en Vercel, indicada abajo |

Cada `push` despliega automáticamente la rama que le corresponde. No hay
comandos de despliegue que ejecutar a mano.

## Flujo de trabajo

1. Todo cambio se hace en `staging` y se sube: `git push origin staging`.
2. Vercel despliega esa rama en su URL fija. Ahí se revisa y se valida.
3. Cuando el cambio está aprobado, se lleva a producción fusionando:

   ```sh
   git checkout main
   git merge --ff-only staging
   git push origin main
   ```

4. Vercel vuelve a construir y publica en producción.

Si algo sale mal en producción, en Vercel se puede volver al despliegue
anterior con *Instant Rollback*, sin tocar el código.

## Notas

- Los despliegues de staging llevan cabecera `X-Robots-Tag: noindex`, así que
  Google no indexa el borrador.
- El formulario de contacto necesita `RESEND_API_KEY` y `CONTACT_FROM` como
  variables de entorno en Vercel. Sin ellas devuelve un error controlado y
  ofrece el contacto directo; nunca muestra un envío como correcto.
- `SITE_ORIGIN` debe valer el origen público de cada entorno. En producción es
  `https://aisolutionsblue.com`.
- El DNS del dominio no está en GoDaddy sino en Dinahosting
  (`ns.dinahosting.com` … `ns4.dinahosting.com`). Para publicar en el dominio
  hacen falta dos registros: `A @ -> 216.198.79.1` y
  `CNAME www -> 3d5c7c6d09b5fe50.vercel-dns-017.com.`. Los MX y los TXT del
  correo no se tocan.
