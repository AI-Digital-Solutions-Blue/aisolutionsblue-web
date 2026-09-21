export const CONTACT_RECIPIENTS = [
  'alejandro.guerra@aisolutionsblue.com',
  'cristian.urien@aisolutionsblue.com',
  'pablo.gonzalez@siweb.es',
] as const;

export const CONTACT_INTERESTS = [
  'Atención al cliente con IA',
  'Automatización de procesos',
  'Soluciones a medida',
  'Quiero orientación',
];
export interface ContactData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  requestId: string;
}
type Validation = { ok: true; data: ContactData } | { ok: false; message: string };
export function validateContact(form: URLSearchParams): Validation {
  const get = (key: string) => (form.get(key) || '').trim();
  const name = get('name'),
    email = get('email'),
    phone = get('phone'),
    interest = get('interest'),
    message = get('message');
  if (name.length < 2 || name.length > 100 || /[\r\n\x00-\x1f]/.test(name))
    return { ok: false, message: 'Escribe un nombre válido, de entre 2 y 100 caracteres.' };
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || /[\r\n]/.test(email))
    return { ok: false, message: 'Revisa tu dirección de email.' };
  if (phone.length > 30 || (phone && !/^[+\d\s().-]{6,30}$/.test(phone)))
    return { ok: false, message: 'Revisa el teléfono o deja el campo vacío.' };
  if (!CONTACT_INTERESTS.includes(interest))
    return { ok: false, message: 'Selecciona en qué podemos ayudarte.' };
  if (message.length < 10 || message.length > 3000 || message.includes('\0'))
    return {
      ok: false,
      message: 'Cuéntanos qué necesitas en un mensaje de entre 10 y 3000 caracteres.',
    };
  if (get('consent') !== 'yes')
    return {
      ok: false,
      message: 'Debes aceptar la política de privacidad y los términos para enviar tu consulta.',
    };
  const suppliedId = get('requestId');
  const requestId = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(
    suppliedId,
  )
    ? suppliedId
    : crypto.randomUUID();
  return { ok: true, data: { name, email, phone, interest, message, requestId } };
}

export function contactEmail(data: ContactData) {
  return {
    to: [...CONTACT_RECIPIENTS],
    replyTo: data.email,
    subject: `Nueva consulta Blue · ${data.interest}`,
    text: [
      'Nueva consulta desde aisolutionsblue.com',
      '',
      `Nombre: ${data.name}`,
      `Email: ${data.email}`,
      `Teléfono: ${data.phone || 'No indicado'}`,
      `Interés: ${data.interest}`,
      '',
      'Mensaje:',
      data.message,
      '',
      'El visitante ha aceptado la política de privacidad y los términos y condiciones.',
    ].join('\n'),
  };
}

// Bounded, process-local limiter for the standalone Node deployment. Use a shared store if scaling to multiple replicas.
export function createRateLimiter(limit = 5, windowMs = 15 * 60 * 1000, maxEntries = 5000) {
  const entries = new Map<string, { count: number; expires: number }>();
  return (key: string, now = Date.now()) => {
    for (const [id, value] of entries) if (value.expires <= now) entries.delete(id);
    const current = entries.get(key);
    if (current) {
      if (current.count >= limit) return false;
      current.count++;
      return true;
    }
    if (entries.size >= maxEntries) return false;
    entries.set(key, { count: 1, expires: now + windowMs });
    return true;
  };
}
