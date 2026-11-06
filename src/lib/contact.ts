import {
  cleanAttribution,
  cleanMetaId,
  describeAttribution,
  type Attribution,
} from './attribution';

export const CONTACT_RECIPIENTS = [
  'alejandro.guerra@aisolutionsblue.com',
  'cristian.urien@aisolutionsblue.com',
  'pablo.gonzalez@aisolutionsblue.com',
  'marketing@aisolutionsblue.com',
] as const;

// "Blue <marketing@aisolutionsblue.com>" o "marketing@aisolutionsblue.com"
export function parseSender(value: string): { email: string; name?: string } | null {
  const match = value.trim().match(/^(?:(.*?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>|([^<>\s]+@[^<>\s]+))$/);
  if (!match) return null;
  const email = (match[2] || match[3] || '').trim();
  const name = (match[1] || '').trim().replace(/^"|"$/g, '');
  if (!email) return null;
  return name ? { email, name } : { email };
}

export const CONTACT_INTERESTS = [
  'Agentes de IA (voz, WhatsApp, chat)',
  'Automatización de procesos',
  'Software a medida',
  'Todavía no lo sé',
];
export interface ContactData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  requestId: string;
  /** Campaign and click identifiers of the visit (UTM, gclid, fbclid). */
  attribution: Attribution;
  /** The visitor accepted advertising cookies: their lead may be reported to Meta and Google. */
  adsConsent: boolean;
  /** Meta browser identifiers, only sent with advertising consent. */
  fbp: string;
  fbc: string;
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
  // Optional since the short form: when sent, it must be one of the listed options.
  if (interest && !CONTACT_INTERESTS.includes(interest))
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
  const adsConsent = get('consent_ads') === 'yes';
  return {
    ok: true,
    data: {
      name,
      email,
      phone,
      interest: interest || 'Sin indicar',
      message,
      requestId,
      attribution: cleanAttribution((key) => form.get(key)),
      adsConsent,
      fbp: adsConsent ? cleanMetaId(get('fbp')) : '',
      fbc: adsConsent ? cleanMetaId(get('fbc')) : '',
    },
  };
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
      ...origin(data.attribution),
    ].join('\n'),
  };
}

function origin(attribution: Attribution) {
  const lines = describeAttribution(attribution);
  return lines.length
    ? ['', 'Origen de la visita:', ...lines]
    : ['', 'Origen de la visita: directo'];
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
