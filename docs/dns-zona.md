# Zona DNS de aisolutionsblue.com

Inventario completo de la zona tal y como la sirve Dinahosting, exportado por
Diego Bares el 22 de septiembre de 2026 y contrastado contra las respuestas DNS
reales el mismo dia. Sirve para recrear la zona en GoDaddy sin perder ningun
servicio.

El dominio esta registrado en GoDaddy. **La zona se migro a GoDaddy el 22 de
septiembre de 2026**: los servidores de nombres son ahora
`ns29.domaincontrol.com` y `ns30.domaincontrol.com`. Los 18 registros se
recrearon uno a uno y se comprobaron por DNS: todos resuelven igual que en
Dinahosting.

Para volver atras, los servidores de nombres anteriores eran
`ns.dinahosting.com`, `ns2`, `ns3` y `ns4`, y esa zona sigue existiendo en
Dinahosting como red de seguridad.

## Los 18 registros

En Dinahosting el host `SOA` significa el dominio raiz. En GoDaddy ese host se
escribe `@`. Dinahosting tiene un tipo `SPF` propio; en GoDaddy ese registro se
crea como `TXT`.

### A (6)

| Host | Valor | Para que sirve |
| --- | --- | --- |
| `@` | `216.198.79.1` | La web, en Vercel |
| `ftp` | `82.98.154.86` | FTP del hosting |
| `dev` | `134.213.213.172` | Entorno de desarrollo |
| `mail` | `82.98.154.86` | Servidor de correo |
| `autoconfig` | `82.98.145.51` | Configuracion automatica de clientes de correo |
| `autodiscover` | `82.98.145.60` | Configuracion automatica en Outlook |

### CNAME (6)

| Host | Valor | Para que sirve |
| --- | --- | --- |
| `www` | `dc1e90f2facf0683.vercel-dns-017.com.` | Redirige al dominio raiz, en Vercel |
| `brevo1._domainkey` | `b1.aisolutionsblue-com.dkim.brevo.com.` | Firma DKIM de Brevo |
| `brevo2._domainkey` | `b2.aisolutionsblue-com.dkim.brevo.com.` | Firma DKIM de Brevo |
| `em` | `em-aisolutionsblue-com.brand.brevosend.com.` | Subdominio con marca de Brevo |
| `r.em` | `em-aisolutionsblue-com.r.brand.brevosend.com.` | Redirecciones de enlaces de Brevo |
| `img.em` | `em-aisolutionsblue-com.img.brand.brevosend.com.` | Imagenes de los correos de Brevo |

### MX (1)

| Host | Prioridad | Valor |
| --- | --- | --- |
| `@` | 10 | `mail.aisolutionsblue.com.` |

### TXT (9)

| Host | Valor |
| --- | --- |
| `@` | `v=spf1 a mx ~all` |
| `@` | `google-site-verification=dCvF2yxUT7tLmDUy2ABDjnI1Nk6YFeejGMGcPTbYRek` |
| `@` | `google-site-verification=P0cEljgFozUFI-H3Ea6YcCV94YDPFSV2z507khoL6nI` |
| `@` | `brevo-code:a94de9187dd9a26cbc5b6d508761df62` |
| `@` | `brevo-code:82b5b003613555f3cb2e36f8cd924d03` |
| `@` | `brevo-code:ac32671fe690aaaceb5bfea4f45dd2b7` |

| `_dmarc` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` |
| `_twilio` | `twilio-domain-verification=00dcbec05cd6cb850b1cfeeb70b4f2fc` |
| `mail._domainkey` | `k=rsa;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDeMVIzrCa3T14JsNY0IRv5/2V1/v2itlviLQBwXsa7shBD6TrBkswsFUToPyMRWC9tbR/5ey0nRBH0ZVxp+lsmTxid2Y2z+FApQ6ra2VsXfbJP3HE6wAO0YTVEJt1TmeczhEd2Jiz/fcabIISgXEdSpTYJhb0ct0VJRxcg4c8c7wIDAQAB` |
| `default._domainkey` | `v=DKIM1; g=*; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDfPISmo0K/qvksrlbaAF5SPPYce/uwvO3xL14a9HPpAuSIlOB8S5Rq3iNgjze0sSPxNZLBw0tmvgKKF4/f0eFapHG7GUZafHuNCGZWARlN13JMptBnK7N0WFqZYoepOtZSp6HzLcku/oNWWYEueg8GqEBSGZFUfHIhfDN3wFQ2mwIDAQAB` |

Son diez filas porque el SPF cuenta como TXT. En total, 22 registros propios
(GoDaddy anade ademas `NS`, `SOA` y `CNAME _domainconnect`, que no se tocan).

Los tres `brevo-code` son de tres cuentas de Brevo distintas: dos heredadas y
`ac32671f...`, que es la cuenta de AI Digital Solutions Blue que envia el
formulario de contacto de la web.

El SPF (`v=spf1 a mx ~all`) no incluye a Brevo y no hace falta: Brevo firma con
DKIM (`brevo1`/`brevo2`) y usa su propio dominio de retorno, asi que DMARC
alinea por DKIM.

## Que depende de que

- **La web**: `@` y `www`. Los unicos que apuntan a Vercel.
- **El correo**: `MX`, `mail`, `autoconfig`, `autodiscover`, el SPF, el DMARC y
  las cuatro claves DKIM (`brevo1`, `brevo2`, `mail._domainkey`,
  `default._domainkey`). Si falta una clave DKIM el correo sigue saliendo, pero
  empieza a caer en spam sin que salte ningun error.
- **Verificaciones de propiedad**: los dos de Google, los dos de Brevo y el de
  Twilio. Si faltan, esos servicios dan el dominio por no verificado.
- **Otros servicios**: `ftp` y `dev`.

Se comprobo que `webmail`, `smtp`, `imap` y `pop` no existen en la zona, asi que
no hay nada mas que recrear.

## Como se hizo la mudanza a GoDaddy

GoDaddy no deja crear registros mientras el DNS lo sirva otro proveedor, asi que
la zona no se puede dejar preparada de antemano. El orden es:

1. Diego deja el TTL de la zona en 600 o menos. Ya esta en 300.
2. Se cambian los servidores de nombres a los de GoDaddy.
3. Se cargan los 18 registros de inmediato, y se borran los que GoDaddy crea por
   su cuenta al activar la zona (suele poner un `A @` a una IP de aparcamiento y
   un `CNAME www`).
4. Se comprueba nombre por nombre que todo resuelve igual que en esta lista.
5. Se envia y se recibe un correo de prueba.

Diego deja la zona de Dinahosting sin borrar unas semanas, como referencia y red
de seguridad. Una vez cambiados los servidores de nombres, esa zona deja de
consultarse.

Los servidores de nombres de un `.com` tardan hasta 48 horas en propagarse del
todo, de modo que durante el cambio la mayoria de los resolvers siguen usando la
zona completa de Dinahosting mientras se carga la de GoDaddy.


## Registros que anade GoDaddy por su cuenta

Al activar la zona, GoDaddy creo un `A @` a una IP de aparcamiento, un
`CNAME www` al propio dominio y un `TXT _dmarc` con su politica por defecto
(`p=quarantine`, informes a `onsecureserver.net`). Los tres se corrigieron con
los valores buenos. Ademas quedan un `CNAME _domainconnect` y los `NS` y `SOA`
propios de GoDaddy, que son suyos y no se tocan.
