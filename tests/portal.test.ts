import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { leadNotices, leadToContact, metaLeadEmail, validSignature } from '../src/lib/meta-leads';
import { checkPassword, sessionValue, validSession } from '../src/lib/admin-auth';
import { insertContact, listContacts } from '../src/lib/contacts-store';

const SECRET = 'app-secret-de-prueba';
const sign = (body: string) => `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;

test('acepta solo la firma de Meta calculada con el App Secret', () => {
  const body = '{"object":"page","entry":[]}';
  assert.ok(validSignature(body, sign(body), SECRET));
  assert.equal(validSignature(body + ' ', sign(body), SECRET), false);
  assert.equal(validSignature(body, sign(body), 'otro-secreto'), false);
  assert.equal(validSignature(body, null, SECRET), false);
  assert.equal(validSignature(body, 'sha1=abc', SECRET), false);
});

test('saca los avisos de leadgen del webhook de la página e ignora el resto', () => {
  const notices = leadNotices({
    object: 'page',
    entry: [
      {
        changes: [
          {
            field: 'leadgen',
            value: {
              leadgen_id: '444444',
              form_id: '555',
              page_id: '666',
              ad_id: '777',
              adgroup_id: '888',
              created_time: 1762700000,
            },
          },
          { field: 'feed', value: { leadgen_id: '1' } },
          { field: 'leadgen', value: { leadgen_id: '../me' } },
        ],
      },
    ],
  });
  assert.deepEqual(notices, [
    {
      leadgen_id: '444444',
      form_id: '555',
      page_id: '666',
      ad_id: '777',
      adgroup_id: '888',
      created_time: 1762700000,
    },
  ]);
  assert.deepEqual(leadNotices({ object: 'user', entry: [] }), []);
  assert.deepEqual(leadNotices(null), []);
});

const graphLead = {
  id: '444444',
  created_time: '2026-11-09T10:00:00+0000',
  field_data: [
    { name: 'full_name', values: ['Ana Pérez'] },
    { name: 'phone_number', values: ['+34600111222'] },
    { name: '¿qué_necesitas?', values: ['software_a_medida'] },
  ],
  form_id: '555',
  ad_id: '777',
  ad_name: 'Vídeo A',
  adset_id: '888',
  adset_name: 'Formulario instantáneo',
  campaign_id: '999',
  campaign_name: 'Blue – Clientes potenciales',
  platform: 'ig',
  is_organic: false,
};

test('convierte un lead de Meta en un contacto marcado como formulario instantáneo', () => {
  const contact = leadToContact(graphLead, { leadgen_id: '444444', page_id: '666' });
  assert.equal(contact.source, 'meta_form');
  assert.equal(contact.name, 'Ana Pérez');
  assert.equal(contact.phone, '+34600111222');
  assert.equal(contact.email, null);
  assert.equal(contact.interest, 'software a medida');
  assert.equal(contact.meta_leadgen_id, '444444');
  assert.equal(contact.created_at, '2026-11-09T10:00:00.000Z');
  assert.equal(contact.meta?.campaign_name, 'Blue – Clientes potenciales');
  assert.equal(contact.meta?.adset_name, 'Formulario instantáneo');
  assert.equal(contact.meta?.ad_name, 'Vídeo A');
  assert.equal(contact.meta?.form_id, '555');
  assert.equal(contact.meta?.page_id, '666');
  const email = metaLeadEmail(contact);
  assert.match(email.subject, /Meta/);
  assert.match(email.text, /Campaña: Blue – Clientes potenciales/);
  assert.match(email.text, /Teléfono: \+34600111222/);
});

test('un lead sin nombre ni respuestas no rompe nada', () => {
  const contact = leadToContact({ id: '1' }, { leadgen_id: '1' });
  assert.equal(contact.name, 'Sin nombre');
  assert.equal(contact.interest, null);
});

test('la sesión del portal caduca y depende de la contraseña', () => {
  const password = 'una-contraseña-larga';
  const now = Date.UTC(2026, 10, 9);
  const value = sessionValue(password, now);
  assert.ok(validSession(password, value, now));
  assert.equal(validSession('otra-contraseña-larga', value, now), false);
  assert.equal(validSession(password, value, now + 13 * 3600 * 1000), false);
  assert.equal(
    validSession(
      password,
      value.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a')),
      now,
    ),
    false,
  );
  assert.equal(validSession('', value, now), false);
  assert.ok(checkPassword(password, password));
  assert.equal(checkPassword(password, 'una-contraseña-larg'), false);
  assert.equal(checkPassword('', ''), false);
});

test('guarda cada contacto una sola vez y lista con filtros', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const replies = [[{ id: 'a' }], [], []];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(replies.shift()), { status: 200 });
  }) as unknown as typeof fetch;
  const config = { url: 'https://x.supabase.co', key: 'sb_secret_x', fetch: fetcher };
  const contact = leadToContact(graphLead, { leadgen_id: '444444' });
  assert.equal(await insertContact(config, contact), true);
  assert.equal(await insertContact(config, contact), false);
  assert.match(calls[0].url, /on_conflict=meta_leadgen_id/);
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers.apikey, 'sb_secret_x');
  assert.equal(headers.authorization, undefined);
  assert.match(headers.prefer, /ignore-duplicates/);
  await listContacts(config, { source: 'meta_form', status: 'nuevo' });
  assert.match(calls[2].url, /source=eq\.meta_form/);
  assert.match(calls[2].url, /status=eq\.nuevo/);
});
