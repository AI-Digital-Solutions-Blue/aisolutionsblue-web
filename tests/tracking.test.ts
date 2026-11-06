import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cleanAttribution, cleanMetaId } from '../src/lib/attribution';
import { contactEmail, validateContact } from '../src/lib/contact';
import { leadPayload } from '../src/lib/meta-capi';

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

const form = (extra: Record<string, string> = {}) =>
  new URLSearchParams({
    name: 'María López',
    email: 'Maria@Example.com',
    phone: '600 000 000',
    interest: 'Software a medida',
    message: 'Quiero ordenar las reservas de mi negocio.',
    consent: 'yes',
    requestId: '8ac48c4d-fbcc-4782-b1ad-159372c61823',
    ...extra,
  });

test('limpia los parámetros de campaña: sin caracteres de control y con longitud acotada', () => {
  const attribution = cleanAttribution(
    (key) =>
      ({
        utm_source: ' meta ',
        utm_campaign: 'blue_servicios\r\nBcc: x',
        utm_content: 'x'.repeat(400),
        landing: '/contacto?utm_source=meta',
      })[key],
  );
  assert.equal(attribution.utm_source, 'meta');
  assert.equal(attribution.utm_campaign, 'blue_serviciosBcc: x');
  assert.equal(attribution.utm_content?.length, 300);
  assert.equal(attribution.landing, '/contacto?utm_source=meta');
  assert.equal(attribution.gclid, undefined);
});

test('solo acepta identificadores de Meta con su formato', () => {
  assert.equal(cleanMetaId('fb.1.1730000000000.1234567890'), 'fb.1.1730000000000.1234567890');
  assert.equal(cleanMetaId('<script>'), '');
  assert.equal(cleanMetaId(''), '');
});

test('el email al equipo incluye el origen de la visita', () => {
  const result = validateContact(
    form({
      utm_source: 'meta',
      utm_campaign: 'blue_servicios',
      utm_content: 'c2_ia_negocio_sienna',
    }),
  );
  assert.ok(result.ok);
  const text = contactEmail(result.data).text;
  assert.match(text, /Origen de la visita:/);
  assert.match(text, /Fuente: meta/);
  assert.match(text, /Anuncio: c2_ia_negocio_sienna/);
});

test('sin consentimiento de publicidad no se guardan los identificadores de Meta', () => {
  const result = validateContact(form({ fbp: 'fb.1.1730000000000.1234567890' }));
  assert.ok(result.ok);
  assert.equal(result.data.adsConsent, false);
  assert.equal(result.data.fbp, '');
});

test('el Lead para Meta lleva los datos cifrados y el mismo id que el píxel', () => {
  const result = validateContact(
    form({ consent_ads: 'yes', fbp: 'fb.1.1730000000000.1234567890', fbclid: 'AbC123' }),
  );
  assert.ok(result.ok);
  const payload = leadPayload(
    result.data,
    { pixelId: '1', token: 't', url: 'https://aisolutionsblue.com/contacto', ip: '1.2.3.4' },
    1730000000000,
  );
  const event = payload.data[0];
  assert.equal(event.event_name, 'Lead');
  assert.equal(event.event_id, '8ac48c4d-fbcc-4782-b1ad-159372c61823');
  assert.deepEqual(event.user_data.em, [sha('maria@example.com')]);
  assert.deepEqual(event.user_data.ph, [sha('34600000000')]);
  assert.equal(event.user_data.fbp, 'fb.1.1730000000000.1234567890');
  assert.equal(event.user_data.fbc, 'fb.1.1730000000000.AbC123');
  assert.equal(JSON.stringify(payload).includes('maria@example.com'), false);
});
