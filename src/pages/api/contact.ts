import type { APIRoute } from 'astro';
import process from 'node:process';
import { Resend } from 'resend';
import { contactEmail, createRateLimiter, validateContact } from '../../lib/contact';

export const prerender = false;
const allowRequest = createRateLimiter();
const MAX_BODY = 16000;

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
function respond(request: Request, status: number, message: string) {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tu consulta · Blue</title><style>body{font:18px/1.7 system-ui,sans-serif;color:#16223b;background:#f8f9fc;max-width:600px;margin:15vh auto;padding:24px}h1{font-size:36px;line-height:1.2}a{color:#3459ef}p{margin:24px 0}</style></head><body><main><h1>${status < 300 ? 'Gracias por escribirnos.' : 'No hemos podido enviar tu consulta.'}</h1><p>${escape(message)}</p><p>También puedes escribir a <a href="mailto:marketing@aisolutionsblue.com">marketing@aisolutionsblue.com</a>.</p><a href="/contacto">Volver a Blue</a></main></body></html>`,
      { status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
  return Response.json({ ok: status < 300, message }, { status, headers });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const origin = request.headers.get('origin');
  const expected = import.meta.env.DEV
    ? new URL(request.url).origin
    : process.env.SITE_ORIGIN || 'https://aisolutionsblue.com';
  if (!origin || origin !== expected)
    return respond(
      request,
      403,
      'No se ha podido verificar el origen de la solicitud. Recarga la página e inténtalo de nuevo.',
    );
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))
    return respond(request, 415, 'El formato de la solicitud no es válido.');
  if (Number(request.headers.get('content-length')) > MAX_BODY)
    return respond(request, 413, 'El mensaje es demasiado largo.');
  const reader = request.body?.getReader();
  if (!reader) return respond(request, 400, 'La solicitud está vacía.');
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY) {
        await reader.cancel();
        return respond(request, 413, 'El mensaje es demasiado largo.');
      }
      chunks.push(value);
    }
  } catch {
    return respond(request, 400, 'No se pudo leer la solicitud.');
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  const form = new URLSearchParams(new TextDecoder().decode(buffer));
  if (form.get('website')) return respond(request, 200, 'Solicitud recibida.');
  const validation = validateContact(form);
  if (!validation.ok) return respond(request, 400, validation.message);
  const apiKey = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM || import.meta.env.CONTACT_FROM;
  if (!apiKey || !from)
    return respond(request, 503, 'El formulario no está disponible en este momento.');
  if (!allowRequest(clientAddress || 'unknown'))
    return respond(
      request,
      429,
      'Has enviado varias consultas. Espera unos minutos antes de intentarlo de nuevo.',
    );
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      { from, ...contactEmail(validation.data) },
      { idempotencyKey: `blue-contact/${validation.data.requestId}` },
    );
    if (error || !data?.id)
      return respond(
        request,
        502,
        'No se ha podido confirmar el envío. Inténtalo de nuevo en unos minutos.',
      );
    return respond(
      request,
      200,
      'Hemos recibido tu consulta. Nuestro equipo se pondrá en contacto contigo.',
    );
  } catch {
    return respond(
      request,
      502,
      'No se ha podido confirmar el envío. Inténtalo de nuevo en unos minutos.',
    );
  }
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
