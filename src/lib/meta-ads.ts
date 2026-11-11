// Automatic ad spend from Meta: the Marketing API's insights of Blue's ad account, per ad and
// per day, saved in the portal's ad_spend table. Read-only token of the system user
// «Portal contactos» with ads_read (META_ADS_TOKEN), signed with the app secret.
import { createHmac } from 'node:crypto';
import { call, type StoreConfig } from './contacts-store';
import { euros, type AdSpend, type NewSpend } from './ad-spend';
import { serverEnv } from './server-env';

const GRAPH_VERSION = 'v27.0';
/** Blue's ad account in Meta (public identifier, not a secret). */
const DEFAULT_ACCOUNT = '1106106519033512';
/** Marks the lines written by the sync; manual Meta lines in the synced days are replaced. */
export const AUTO_NOTE = 'Automático (Meta)';
export const TODAY_NOTE = 'Automático (Meta) · día en curso';

export interface MetaAdsConfig {
  token: string;
  appSecret: string;
  accountId: string;
  fetch?: typeof fetch;
}

export function metaAdsConfig(): MetaAdsConfig | null {
  const token = serverEnv('META_ADS_TOKEN');
  const appSecret = serverEnv('META_APP_SECRET');
  if (!token || !appSecret) return null;
  const accountId = serverEnv('META_AD_ACCOUNT_ID').replace(/^act_/, '') || DEFAULT_ACCOUNT;
  return { token, appSecret, accountId };
}

interface InsightRow {
  campaign_name?: string;
  ad_name?: string;
  spend?: string;
  date_start?: string;
  date_stop?: string;
}

/** Spend per ad and per day between two dates (YYYY-MM-DD, in the ad account's time zone). */
export async function fetchMetaSpend(config: MetaAdsConfig, since: string, until: string) {
  const http = config.fetch || fetch;
  const rows: InsightRow[] = [];
  let url: string | null =
    `https://graph.facebook.com/${GRAPH_VERSION}/act_${config.accountId}/insights?${new URLSearchParams(
      {
        level: 'ad',
        fields: 'campaign_name,ad_name,spend,date_start,date_stop',
        time_increment: '1',
        time_range: JSON.stringify({ since, until }),
        limit: '500',
        access_token: config.token,
        appsecret_proof: createHmac('sha256', config.appSecret).update(config.token).digest('hex'),
      },
    )}`;
  for (let page = 0; url && page < 20; page++) {
    const response: Response = await http(url, { signal: AbortSignal.timeout(10000) });
    const body = (await response.json().catch(() => ({}))) as {
      data?: InsightRow[];
      paging?: { next?: string };
      error?: { message?: string };
    };
    if (!response.ok) throw new Error(body.error?.message || `Meta ${response.status}`);
    rows.push(...(body.data || []));
    url = body.paging?.next || null;
  }
  return rows;
}

/** Insight rows → spend lines (one per ad and day). Ads that spent nothing are left out. */
export function toSpendLines(rows: InsightRow[], today: string): NewSpend[] {
  const lines = new Map<string, NewSpend>();
  for (const row of rows) {
    const day = row.date_start || '';
    const amount = Math.round(euros(row.spend || 0) * 100) / 100;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || amount <= 0) continue;
    const line: NewSpend = {
      platform: 'meta',
      campaign: (row.campaign_name || 'Sin campaña').slice(0, 160),
      ad: (row.ad_name || '').slice(0, 160),
      date_from: day,
      date_to: day,
      amount,
      notes: day === today ? TODAY_NOTE : AUTO_NOTE,
    };
    const key = `${line.campaign}\u0000${line.ad}\u0000${day}`;
    const existing = lines.get(key);
    if (existing) existing.amount = Math.round((existing.amount + amount) * 100) / 100;
    else lines.set(key, line);
  }
  return [...lines.values()];
}

const keyOf = (row: Pick<NewSpend, 'campaign' | 'ad' | 'date_from' | 'date_to'>) =>
  [row.campaign, row.ad, row.date_from, row.date_to].join('\u0000');

/**
 * Brings the Meta lines of the last `days` days in line with Meta: saves each ad's spend per
 * day and removes the Meta lines of those days that Meta no longer reports (or that were
 * typed in by hand before the sync existed, such as a two-day total).
 */
export async function syncMetaSpend(
  meta: MetaAdsConfig,
  store: StoreConfig,
  days = 7,
  now = new Date(),
) {
  const dayIn = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary' }).format(date);
  const today = dayIn(now);
  const since = dayIn(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
  const lines = toSpendLines(await fetchMetaSpend(meta, since, today), today);

  if (lines.length)
    await call(store, 'ad_spend?on_conflict=platform,campaign,ad,date_from,date_to', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(lines.map((line) => ({ ...line, updated_at: now.toISOString() }))),
    });

  const keep = new Set(lines.map(keyOf));
  const existing = (await (
    await call(
      store,
      `ad_spend?${new URLSearchParams({
        select: 'id,campaign,ad,date_from,date_to',
        platform: 'eq.meta',
        date_from: `gte.${since}`,
      })}`,
    )
  ).json()) as Pick<AdSpend, 'id' | 'campaign' | 'ad' | 'date_from' | 'date_to'>[];
  const stale = existing.filter((row) => !keep.has(keyOf(row))).map((row) => row.id);
  if (stale.length)
    await call(store, `ad_spend?id=in.(${stale.map(encodeURIComponent).join(',')})`, {
      method: 'DELETE',
      headers: { prefer: 'return=minimal' },
    });
  return { saved: lines.length, removed: stale.length, since, until: today };
}

/* ---------- Light automation: refresh on visit, at most every 30 minutes ---------- */

let lastSync = 0;
let lastResult: { at: number; ok: boolean; message: string } | null = null;
const EVERY = 30 * 60 * 1000;

export function lastMetaSync() {
  return lastResult;
}

/** Syncs when the portal is opened and the last sync is older than 30 minutes (or `force`). */
export async function refreshMetaSpend(store: StoreConfig | null, force = false) {
  const meta = metaAdsConfig();
  if (!meta || !store) return null;
  const now = Date.now();
  if (!force && now - lastSync < EVERY) return lastResult;
  lastSync = now;
  try {
    const result = await syncMetaSpend(meta, store);
    lastResult = {
      at: now,
      ok: true,
      message: `${result.saved} ${result.saved === 1 ? 'línea' : 'líneas'} de Meta al día`,
    };
  } catch (error) {
    lastResult = {
      at: now,
      ok: false,
      message: `Meta no respondió: ${String((error as Error)?.message || error).slice(0, 160)}`,
    };
  }
  return lastResult;
}
