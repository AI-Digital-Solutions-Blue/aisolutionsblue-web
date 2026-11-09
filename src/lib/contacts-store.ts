// The contacts portal's store: one Supabase table, reached through its REST API (PostgREST)
// with the project's secret key. Only the server uses it; the key never reaches the browser.
import type { Attribution } from './attribution';
import { serverEnv } from './server-env';

export const CONTACT_STATUSES = [
  'nuevo',
  'contactado',
  'en_conversacion',
  'cliente',
  'descartado',
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export const STATUS_LABELS: Record<ContactStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  en_conversacion: 'En conversación',
  cliente: 'Cliente',
  descartado: 'Descartado',
};

export type ContactSource = 'web' | 'meta_form';
export const SOURCE_LABELS: Record<ContactSource, string> = {
  web: 'Web – formulario de contacto',
  meta_form: 'Meta – formulario instantáneo',
};

export interface MetaLeadInfo {
  form_id?: string;
  page_id?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  platform?: string;
  is_organic?: boolean;
  /** Every answer of the form, as Meta sent it. */
  answers?: Record<string, string>;
}

export interface NewContact {
  source: ContactSource;
  created_at?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  interest?: string | null;
  message?: string | null;
  request_id?: string | null;
  attribution?: Attribution;
  meta_leadgen_id?: string | null;
  meta?: MetaLeadInfo;
}

export interface StoredContact extends Required<Omit<NewContact, 'created_at'>> {
  id: string;
  created_at: string;
  updated_at: string | null;
  status: ContactStatus;
  notes: string | null;
}

export interface StoreConfig {
  url: string;
  key: string;
  fetch?: typeof fetch;
}

export function storeConfig(): StoreConfig | null {
  const url = serverEnv('SUPABASE_URL').replace(/\/+$/, '');
  const key = serverEnv('SUPABASE_SECRET_KEY');
  // Plain http only for a local database in development.
  const allowed = import.meta.env.DEV ? /^https?:\/\/[\w.:-]+$/ : /^https:\/\/[\w.-]+$/;
  if (!allowed.test(url) || !key) return null;
  return { url, key };
}

function headers(config: StoreConfig, extra: Record<string, string> = {}) {
  const out: Record<string, string> = { apikey: config.key, accept: 'application/json', ...extra };
  // Legacy service_role keys are JWTs and also go as a bearer token; new sb_secret_ keys do not.
  if (config.key.startsWith('eyJ')) out.authorization = `Bearer ${config.key}`;
  return out;
}

async function call(config: StoreConfig, path: string, init: RequestInit = {}) {
  const response = await (config.fetch || fetch)(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: headers(config, (init.headers as Record<string, string>) || {}),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return response;
}

/**
 * Inserts a contact once. A repeated request_id (web) or meta_leadgen_id (Meta) is ignored.
 * Returns true when the row is new, false when it already existed.
 */
export async function insertContact(config: StoreConfig, contact: NewContact) {
  const conflict = contact.meta_leadgen_id ? 'meta_leadgen_id' : 'request_id';
  const response = await call(config, `contacts?on_conflict=${conflict}&select=id`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      prefer: 'resolution=ignore-duplicates,return=representation',
    },
    body: JSON.stringify(contact),
  });
  const rows = (await response.json()) as unknown[];
  return rows.length > 0;
}

export async function hasMetaLead(config: StoreConfig, leadgenId: string) {
  const response = await call(
    config,
    `contacts?select=id&meta_leadgen_id=eq.${encodeURIComponent(leadgenId)}&limit=1`,
  );
  return ((await response.json()) as unknown[]).length > 0;
}

export interface ContactFilter {
  source?: ContactSource;
  status?: ContactStatus;
}

export async function listContacts(config: StoreConfig, filter: ContactFilter = {}, limit = 300) {
  const query = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
    limit: String(limit),
  });
  if (filter.source) query.set('source', `eq.${filter.source}`);
  if (filter.status) query.set('status', `eq.${filter.status}`);
  const response = await call(config, `contacts?${query}`);
  return (await response.json()) as StoredContact[];
}

export async function updateContact(
  config: StoreConfig,
  id: string,
  change: { status: ContactStatus; notes: string },
) {
  await call(config, `contacts?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify({ ...change, updated_at: new Date().toISOString() }),
  });
}

export const isStatus = (value: string): value is ContactStatus =>
  (CONTACT_STATUSES as readonly string[]).includes(value);
export const isSource = (value: string): value is ContactSource =>
  value === 'web' || value === 'meta_form';
export const isUuid = (value: string) =>
  /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(value);
