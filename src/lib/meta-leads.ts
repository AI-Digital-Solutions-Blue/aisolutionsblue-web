// Meta instant-form leads: the Page webhook announces each lead with its id, and the full answers
// are read from the Graph API with a Page token that has leads_retrieval.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { CONTACT_RECIPIENTS } from './contact';
import type { Email } from './brevo';
import type { MetaLeadInfo, NewContact } from './contacts-store';

const GRAPH_VERSION = 'v27.0';

/** Checks X-Hub-Signature-256 ("sha256=<hex>") against the raw body and the App Secret. */
export function validSignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header || !appSecret) return false;
  const match = header.match(/^sha256=([a-f\d]{64})$/i);
  if (!match) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  const received = Buffer.from(match[1], 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export interface LeadNotice {
  leadgen_id: string;
  form_id?: string;
  page_id?: string;
  ad_id?: string;
  adgroup_id?: string;
  created_time?: number;
}

const ID = /^\d{1,30}$/;
const optionalId = (value: unknown) =>
  typeof value === 'string' && ID.test(value)
    ? value
    : typeof value === 'number' && Number.isSafeInteger(value)
      ? String(value)
      : undefined;

/** Lead notices from a Page webhook payload; anything else is ignored. */
export function leadNotices(payload: unknown): LeadNotice[] {
  if (!payload || typeof payload !== 'object') return [];
  const { object, entry } = payload as { object?: unknown; entry?: unknown };
  if (object !== 'page' || !Array.isArray(entry)) return [];
  const out: LeadNotice[] = [];
  for (const item of entry) {
    const changes = (item as { changes?: unknown })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const { field, value } = (change || {}) as {
        field?: unknown;
        value?: Record<string, unknown>;
      };
      if (field !== 'leadgen' || !value) continue;
      const leadgenId = optionalId(value.leadgen_id);
      if (!leadgenId) continue;
      out.push({
        leadgen_id: leadgenId,
        form_id: optionalId(value.form_id),
        page_id: optionalId(value.page_id),
        ad_id: optionalId(value.ad_id),
        adgroup_id: optionalId(value.adgroup_id),
        created_time: typeof value.created_time === 'number' ? value.created_time : undefined,
      });
    }
  }
  return out;
}

export interface GraphLead {
  id: string;
  created_time?: string;
  field_data?: { name?: string; values?: string[] }[];
  form_id?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  platform?: string;
  is_organic?: boolean;
}

/** Reads one lead from the Graph API. Throws on failure, so the webhook asks Meta to retry. */
export async function fetchLead(
  leadgenId: string,
  pageToken: string,
  appSecret: string,
  fetcher: typeof fetch = fetch,
): Promise<GraphLead> {
  const query = new URLSearchParams({
    fields:
      'created_time,field_data,form_id,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,platform,is_organic',
    access_token: pageToken,
    appsecret_proof: createHmac('sha256', appSecret).update(pageToken).digest('hex'),
  });
  const response = await fetcher(
    `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}?${query}`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error(`Graph ${response.status}`);
  return (await response.json()) as GraphLead;
}

const clean = (value: string, max: number) =>
  value
    .replace(/[\x00-\x1f\x7f]+/g, ' ')
    .trim()
    .slice(0, max);
// Meta returns option keys like "software_a_medida": they read better with spaces.
const readable = (value: string) => clean(value.replace(/_/g, ' '), 500);
const STANDARD = new Set([
  'full_name',
  'first_name',
  'last_name',
  'email',
  'phone_number',
  'phone',
]);

/** Turns a Graph lead into a portal contact, marked as coming from Meta's instant form. */
export function leadToContact(lead: GraphLead, notice: LeadNotice): NewContact {
  const answers: Record<string, string> = {};
  for (const field of lead.field_data || []) {
    if (!field?.name || !Array.isArray(field.values)) continue;
    answers[clean(field.name, 100)] = clean(field.values.join(', '), 1000);
  }
  const name =
    answers.full_name ||
    [answers.first_name, answers.last_name].filter(Boolean).join(' ') ||
    'Sin nombre';
  const custom = Object.entries(answers).filter(([key]) => !STANDARD.has(key));
  const meta: MetaLeadInfo = {
    form_id: lead.form_id || notice.form_id,
    page_id: notice.page_id,
    ad_id: lead.ad_id || notice.ad_id,
    ad_name: lead.ad_name,
    adset_id: lead.adset_id || notice.adgroup_id,
    adset_name: lead.adset_name,
    campaign_id: lead.campaign_id,
    campaign_name: lead.campaign_name,
    platform: lead.platform,
    is_organic: lead.is_organic,
    answers,
  };
  const created = lead.created_time
    ? new Date(lead.created_time)
    : notice.created_time
      ? new Date(notice.created_time * 1000)
      : null;
  return {
    source: 'meta_form',
    ...(created && !Number.isNaN(created.getTime()) ? { created_at: created.toISOString() } : {}),
    name: clean(name, 100),
    email: answers.email || null,
    phone: answers.phone_number || answers.phone || null,
    interest: custom[0] ? readable(custom[0][1]) : null,
    message:
      custom.length > 1
        ? custom
            .slice(1)
            .map(([key, value]) => `${readable(key)}: ${value}`)
            .join('\n')
        : null,
    meta_leadgen_id: lead.id && ID.test(lead.id) ? lead.id : notice.leadgen_id,
    meta: Object.fromEntries(
      Object.entries(meta).filter(([, value]) => value !== undefined && value !== ''),
    ) as MetaLeadInfo,
  };
}

export function metaLeadEmail(contact: NewContact): Email {
  const meta = contact.meta || {};
  const line = (label: string, value?: string | null) => (value ? [`${label}: ${value}`] : []);
  return {
    to: [...CONTACT_RECIPIENTS],
    ...(contact.email ? { replyTo: contact.email } : {}),
    subject: `Nuevo contacto de Meta · ${contact.interest || 'Formulario instantáneo'}`,
    text: [
      'Nuevo contacto desde el formulario instantáneo de Meta',
      '',
      `Nombre: ${contact.name}`,
      `Teléfono: ${contact.phone || 'No indicado'}`,
      ...line('Email', contact.email),
      `¿Qué necesita?: ${contact.interest || 'Sin indicar'}`,
      ...(contact.message ? ['', contact.message] : []),
      '',
      'Origen: Meta – formulario instantáneo',
      ...line('Campaña', meta.campaign_name || meta.campaign_id),
      ...line('Conjunto de anuncios', meta.adset_name || meta.adset_id),
      ...line('Anuncio', meta.ad_name || meta.ad_id),
      ...line('Formulario', meta.form_id),
      ...line('Plataforma', meta.platform),
      '',
      'Lo tienes también en el portal de contactos: https://aisolutionsblue.com/admin',
    ].join('\n'),
    reference: contact.meta_leadgen_id || undefined,
  };
}

/** Facebook Page of Blue («AI Digital Solutions Blue»), whose instant-form leads the portal receives. */
export const BLUE_PAGE_ID = '1278352498701006';

/**
 * Subscribes the Page to the app's "leadgen" webhook, so Meta announces every new lead.
 * The system-user token reads the Page's own token first; neither leaves the server.
 */
export async function subscribePage(
  systemToken: string,
  appSecret: string,
  pageId = BLUE_PAGE_ID,
  fetcher: typeof fetch = fetch,
): Promise<{ ok: boolean; message: string }> {
  const proof = (token: string) => createHmac('sha256', appSecret).update(token).digest('hex');
  const base = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}`;
  try {
    const pageResponse = await fetcher(
      `${base}?${new URLSearchParams({ fields: 'access_token,name', access_token: systemToken, appsecret_proof: proof(systemToken) })}`,
      { signal: AbortSignal.timeout(8000) },
    );
    const page = (await pageResponse.json().catch(() => ({}))) as {
      access_token?: string;
      error?: { message?: string };
    };
    if (!pageResponse.ok || !page.access_token)
      return { ok: false, message: page.error?.message || 'No se pudo leer la página.' };
    const subscribe = await fetcher(`${base}/subscribed_apps`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        subscribed_fields: 'leadgen',
        access_token: page.access_token,
        appsecret_proof: proof(page.access_token),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const result = (await subscribe.json().catch(() => ({}))) as {
      success?: boolean;
      error?: { message?: string };
    };
    return result.success
      ? { ok: true, message: 'Página conectada: los contactos de Meta llegarán al portal.' }
      : { ok: false, message: result.error?.message || 'Meta no aceptó la suscripción.' };
  } catch {
    return { ok: false, message: 'No se pudo contactar con Meta.' };
  }
}
