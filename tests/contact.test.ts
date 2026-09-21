import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTACT_RECIPIENTS,
  contactEmail,
  createRateLimiter,
  validateContact,
} from '../src/lib/contact';

const valid = () =>
  new URLSearchParams({
    name: 'María López',
    email: 'maria@example.com',
    phone: '+34 600 000 000',
    interest: 'Automatización de procesos',
    message: 'Me gustaría automatizar las tareas repetitivas de mi equipo.',
    consent: 'yes',
    requestId: '8ac48c4d-fbcc-4782-b1ad-159372c61823',
  });

test('acepta nombres con acentos y un teléfono opcional', () => {
  const form = valid();
  form.set('phone', '');
  const result = validateContact(form);
  assert.ok(result.ok);
  assert.equal(result.data.name, 'María López');
  assert.equal(result.data.phone, '');
});

test('rechaza inyección de cabeceras, direcciones inválidas y datos fuera de límites', () => {
  for (const [key, value] of [
    ['email', 'maria@example.com\r\nBcc:other@example.com'],
    ['email', 'not-an-email'],
    ['name', 'Persona\nOtra'],
    ['name', 'a'.repeat(101)],
    ['message', 'x'.repeat(3001)],
    ['message', 'hola'],
    ['phone', 'un teléfono'],
    ['interest', 'opción no permitida'],
  ]) {
    const form = valid();
    form.set(key, value);
    assert.equal(validateContact(form).ok, false, `Debe rechazar ${key}`);
  }
});

test('el consentimiento no puede omitirse ni sustituirse por un valor arbitrario', () => {
  for (const value of ['', 'false', 'on']) {
    const form = valid();
    form.set('consent', value);
    assert.equal(validateContact(form).ok, false);
  }
});

test('el visitante no puede cambiar los destinatarios y el mensaje se envía como texto', () => {
  const form = valid();
  form.set('to', 'attacker@example.com');
  form.set('message', '<script>alert("test")</script> Quiero información.');
  const result = validateContact(form);
  assert.ok(result.ok);
  const email = contactEmail(result.data);
  assert.deepEqual(email.to, [
    'alejandro.guerra@aisolutionsblue.com',
    'cristian.urien@aisolutionsblue.com',
    'pablo.gonzalez@siweb.es',
  ]);
  assert.deepEqual(email.to, CONTACT_RECIPIENTS);
  assert.equal(email.replyTo, 'maria@example.com');
  assert.ok(!('html' in email));
  assert.ok(email.text.includes('<script>'));
});

test('conserva la clave de reintento válida y reemplaza claves no válidas', () => {
  const form = valid();
  const a = validateContact(form);
  assert.ok(a.ok);
  const b = validateContact(form);
  assert.ok(b.ok);
  assert.equal(a.data.requestId, b.data.requestId);
  form.set('requestId', '../invalid');
  const c = validateContact(form);
  assert.ok(c.ok);
  assert.match(c.data.requestId, /^[a-f\d-]{36}$/);
});

test('limita ráfagas por cliente, permite otros clientes y se recupera al expirar', () => {
  const allow = createRateLimiter(2, 1000, 10);
  assert.equal(allow('client-a', 0), true);
  assert.equal(allow('client-a', 100), true);
  assert.equal(allow('client-a', 200), false);
  assert.equal(allow('client-b', 200), true);
  assert.equal(allow('client-a', 1000), true);
});

test('el limitador conserva memoria acotada y libera entradas caducadas', () => {
  const allow = createRateLimiter(2, 1000, 2);
  assert.equal(allow('a', 0), true);
  assert.equal(allow('b', 0), true);
  assert.equal(allow('c', 10), false);
  assert.equal(allow('c', 1001), true);
});
