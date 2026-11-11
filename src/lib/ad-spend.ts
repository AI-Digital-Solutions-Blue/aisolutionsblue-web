// Ad spend of the portal: what each campaign and ad cost over a period (one or more days),
// typed in from Meta's Ads Manager and Google Ads. Table public.ad_spend in Supabase.
import { call, type StoreConfig } from './contacts-store';

export const PLATFORMS = ['meta', 'google'] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_LABELS: Record<Platform, string> = {
  meta: 'Meta (Facebook e Instagram)',
  google: 'Google Ads',
};
export const isPlatform = (value: string): value is Platform =>
  (PLATFORMS as readonly string[]).includes(value);

export interface AdSpend {
  id: string;
  platform: Platform;
  campaign: string;
  ad: string;
  date_from: string;
  date_to: string;
  /** Euros. PostgREST returns numeric columns as numbers or strings; both are accepted. */
  amount: number | string;
  notes: string | null;
  updated_at: string | null;
}

export interface NewSpend {
  platform: Platform;
  campaign: string;
  ad: string;
  date_from: string;
  date_to: string;
  amount: number;
  notes: string | null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Why a line could not be saved, shown in the portal. */
export const SPEND_ERRORS = {
  platform: 'Elige la plataforma.',
  campaign: 'Escribe el nombre de la campaña.',
  dates: 'Las fechas no son válidas.',
  order: 'La fecha final es anterior a la inicial.',
  amount: 'El importe no es válido.',
  save: 'No se ha podido guardar. Inténtalo de nuevo.',
  delete: 'No se ha podido eliminar. Inténtalo de nuevo.',
  db: 'Falta conectar la base de datos.',
  sync: 'No se ha podido actualizar el gasto de Meta. Mira el aviso de arriba.',
} as const;
export type SpendError = keyof typeof SPEND_ERRORS;

/** Validates a form into a row, or returns the code of the reason it is not valid. */
export function parseSpend(form: {
  get(name: string): FormDataEntryValue | null;
}): NewSpend | SpendError {
  const text = (name: string, max: number) =>
    String(form.get(name) || '')
      .replace(/\0/g, '')
      .trim()
      .slice(0, max);
  const platform = text('platform', 20);
  const campaign = text('campaign', 160);
  const ad = text('ad', 160);
  const from = text('date_from', 10);
  const to = text('date_to', 10) || from;
  const amount = Number(text('amount', 20).replace(/\s|€/g, '').replace(',', '.'));
  const notes = text('notes', 300) || null;
  if (!isPlatform(platform)) return 'platform';
  if (!campaign) return 'campaign';
  if (
    !DAY.test(from) ||
    !DAY.test(to) ||
    Number.isNaN(Date.parse(from)) ||
    Number.isNaN(Date.parse(to))
  )
    return 'dates';
  if (to < from) return 'order';
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return 'amount';
  return {
    platform,
    campaign,
    ad,
    date_from: from,
    date_to: to,
    amount: Math.round(amount * 100) / 100,
    notes,
  };
}

/** Rows whose period ends on or after `since` (YYYY-MM-DD), or every row. */
export async function listSpend(config: StoreConfig, since?: string, limit = 2000) {
  const query = new URLSearchParams({
    select: 'id,platform,campaign,ad,date_from,date_to,amount,notes,updated_at',
    order: 'date_to.desc,platform.asc,campaign.asc,amount.desc',
    limit: String(limit),
  });
  if (since) query.set('date_to', `gte.${since}`);
  const response = await call(config, `ad_spend?${query}`);
  return (await response.json()) as AdSpend[];
}

/** Saves a row; the same platform, campaign, ad and period overwrite the earlier amount. */
export async function saveSpend(config: StoreConfig, row: NewSpend) {
  await call(config, 'ad_spend?on_conflict=platform,campaign,ad,date_from,date_to', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
  });
}

export async function deleteSpend(config: StoreConfig, id: string) {
  await call(config, `ad_spend?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { prefer: 'return=minimal' },
  });
}

export const euros = (value: number | string) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

export interface SpendSummary {
  total: number;
  byPlatform: Record<Platform, number>;
  campaigns: {
    platform: Platform;
    campaign: string;
    total: number;
    rows: AdSpend[];
  }[];
  /** First and last day covered by the rows. */
  from: string;
  to: string;
}

export function summarizeSpend(rows: AdSpend[]): SpendSummary {
  const byPlatform = { meta: 0, google: 0 } as Record<Platform, number>;
  const groups = new Map<string, SpendSummary['campaigns'][number]>();
  let from = '';
  let to = '';
  for (const row of rows) {
    const amount = euros(row.amount);
    byPlatform[row.platform] += amount;
    const key = `${row.platform}\u0000${row.campaign}`;
    const group = groups.get(key) || {
      platform: row.platform,
      campaign: row.campaign,
      total: 0,
      rows: [],
    };
    group.total += amount;
    group.rows.push(row);
    groups.set(key, group);
    if (!from || row.date_from < from) from = row.date_from;
    if (!to || row.date_to > to) to = row.date_to;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    total: round(byPlatform.meta + byPlatform.google),
    byPlatform: { meta: round(byPlatform.meta), google: round(byPlatform.google) },
    campaigns: [...groups.values()]
      .map((g) => ({ ...g, total: round(g.total) }))
      .sort((a, b) => b.total - a.total),
    from,
    to,
  };
}
