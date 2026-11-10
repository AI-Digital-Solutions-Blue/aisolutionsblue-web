// The funnel of the portal: what visitors do on the web (Google Analytics, only visitors who accept
// analytics cookies) and what happens to the contacts afterwards (the portal's own data, complete).
import type { Attribution } from './attribution';
import { batchRunReports, rowsOf, type Ga4Config, type ReportRequest } from './ga4';
import { listContactsSince, type FunnelContact, type StoreConfig } from './contacts-store';

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];
export const isRange = (value: number): value is RangeDays =>
  (RANGES as readonly number[]).includes(value);

export const CHANNELS = ['google_ads', 'meta', 'organico', 'directo', 'otros'] as const;
export type Channel = (typeof CHANNELS)[number];
export const CHANNEL_LABELS: Record<Channel, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta (Facebook e Instagram)',
  organico: 'Google orgánico',
  directo: 'Directo',
  otros: 'Otros',
};
export const isChannel = (value: string): value is Channel =>
  (CHANNELS as readonly string[]).includes(value);

/** GA4 default channel groups that make up each of our channels; «otros» is everything else. */
const GA4_GROUPS: Record<Exclude<Channel, 'otros'>, string[]> = {
  google_ads: ['Paid Search', 'Cross-network', 'Paid Shopping'],
  meta: ['Paid Social', 'Organic Social'],
  organico: ['Organic Search'],
  directo: ['Direct'],
};

export function channelOfGroup(group: string): Channel {
  for (const [channel, groups] of Object.entries(GA4_GROUPS))
    if (groups.includes(group)) return channel as Channel;
  return 'otros';
}

/** Channel of a contact, from where its visit came (or Meta's instant form). */
export function channelOfContact(contact: Pick<FunnelContact, 'source' | 'attribution'>): Channel {
  if (contact.source === 'meta_form') return 'meta';
  const a: Attribution = contact.attribution || {};
  const source = (a.utm_source || '').toLowerCase();
  const medium = (a.utm_medium || '').toLowerCase();
  if (a.gclid || (/google|adwords/.test(source) && /cpc|ppc|paid/.test(medium)))
    return 'google_ads';
  if (a.fbclid || /facebook|instagram|^fb$|^ig$|meta/.test(source)) return 'meta';
  if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia)\./.test(hostOf(a.referrer)) && !source)
    return 'organico';
  if (!source && !medium && !a.referrer) return 'directo';
  return 'otros';
}

function hostOf(url = '') {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/* ---------- Google Analytics part ---------- */

const channelFilter = (channel: Channel | null) => {
  if (!channel) return null;
  const groups =
    channel === 'otros'
      ? Object.values(GA4_GROUPS).flat()
      : GA4_GROUPS[channel as keyof typeof GA4_GROUPS];
  const inList = {
    filter: { fieldName: 'sessionDefaultChannelGroup', inListFilter: { values: groups } },
  };
  return channel === 'otros' ? { notExpression: inList } : inList;
};

const and = (...filters: (object | null)[]) => {
  const list = filters.filter(Boolean) as object[];
  if (list.length === 0) return undefined;
  return list.length === 1 ? list[0] : { andGroup: { expressions: list } };
};

export const FUNNEL_EVENTS = ['contact_form_view', 'contact_form_start', 'generate_lead'] as const;

export function ga4Requests(days: RangeDays, channel: Channel | null): ReportRequest[] {
  const dateRanges = [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }];
  const byChannel = channelFilter(channel);
  return [
    // 0. Totals
    {
      dateRanges,
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'engagementRate' },
        { name: 'userEngagementDuration' },
        { name: 'activeUsers' },
        { name: 'screenPageViewsPerSession' },
      ],
      dimensionFilter: and(byChannel),
    },
    // 1. Funnel events, in people
    {
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'totalUsers' }],
      dimensionFilter: and(byChannel, {
        filter: { fieldName: 'eventName', inListFilter: { values: [...FUNNEL_EVENTS] } },
      }),
    },
    // 2. Pages
    {
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'userEngagementDuration' },
      ],
      dimensionFilter: and(byChannel),
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 8,
    },
    // 3. Devices
    {
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'totalUsers' }],
      dimensionFilter: and(byChannel),
    },
    // 4. Channels (always all of them, for the comparison table)
    {
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'totalUsers' }],
    },
  ];
}

export interface WebFunnel {
  visitors: number;
  sessions: number;
  engagementRate: number;
  /** Average attention time per visitor, in seconds (GA4's «average engagement time»). */
  avgEngagementSeconds: number;
  pagesPerSession: number;
  steps: { key: string; label: string; people: number }[];
  pages: { path: string; views: number; avgSeconds: number }[];
  devices: { device: string; people: number }[];
  visitorsByChannel: Record<Channel, number>;
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Ordenador',
  mobile: 'Móvil',
  tablet: 'Tableta',
};

export function parseGa4(reports: Parameters<typeof rowsOf>[0][]): WebFunnel {
  const totals = rowsOf(reports[0])[0] || {};
  const n = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  const events = Object.fromEntries(
    rowsOf(reports[1]).map((row) => [String(row.eventName), n(row.totalUsers)]),
  );
  const visitors = n(totals.totalUsers);
  const visitorsByChannel = Object.fromEntries(CHANNELS.map((c) => [c, 0])) as Record<
    Channel,
    number
  >;
  for (const row of rowsOf(reports[4]))
    visitorsByChannel[channelOfGroup(String(row.sessionDefaultChannelGroup))] += n(row.totalUsers);
  return {
    visitors,
    sessions: n(totals.sessions),
    engagementRate: n(totals.engagementRate),
    avgEngagementSeconds: n(totals.activeUsers)
      ? n(totals.userEngagementDuration) / n(totals.activeUsers)
      : 0,
    pagesPerSession: n(totals.screenPageViewsPerSession),
    steps: [
      { key: 'visit', label: 'Visitan la web', people: visitors },
      {
        key: 'view',
        label: 'Ven el formulario de contacto',
        people: events.contact_form_view || 0,
      },
      { key: 'start', label: 'Empiezan a rellenarlo', people: events.contact_form_start || 0 },
      { key: 'lead', label: 'Lo envían', people: events.generate_lead || 0 },
    ],
    pages: rowsOf(reports[2]).map((row) => ({
      path: String(row.pagePath),
      views: n(row.screenPageViews),
      avgSeconds: n(row.activeUsers) ? n(row.userEngagementDuration) / n(row.activeUsers) : 0,
    })),
    devices: rowsOf(reports[3])
      .map((row) => ({
        device: DEVICE_LABELS[String(row.deviceCategory)] || String(row.deviceCategory),
        people: n(row.totalUsers),
      }))
      .sort((a, b) => b.people - a.people),
    visitorsByChannel,
  };
}

/* ---------- Portal part ---------- */

export interface ContactFunnel {
  total: number;
  web: number;
  metaForm: number;
  steps: { key: string; label: string; people: number }[];
  discarded: number;
  byChannel: Record<Channel, { contacts: number; clients: number }>;
}

const REACHED: Record<string, string[]> = {
  contactado: ['contactado', 'en_conversacion', 'cliente'],
  en_conversacion: ['en_conversacion', 'cliente'],
  cliente: ['cliente'],
};

export function summarizeContacts(
  contacts: FunnelContact[],
  channel: Channel | null,
): ContactFunnel {
  const byChannel = Object.fromEntries(
    CHANNELS.map((c) => [c, { contacts: 0, clients: 0 }]),
  ) as ContactFunnel['byChannel'];
  for (const contact of contacts) {
    const row = byChannel[channelOfContact(contact)];
    row.contacts++;
    if (contact.status === 'cliente') row.clients++;
  }
  const list = channel ? contacts.filter((c) => channelOfContact(c) === channel) : contacts;
  const count = (statuses: string[]) => list.filter((c) => statuses.includes(c.status)).length;
  return {
    total: list.length,
    web: list.filter((c) => c.source === 'web').length,
    metaForm: list.filter((c) => c.source === 'meta_form').length,
    steps: [
      { key: 'contacts', label: 'Contactos recibidos', people: list.length },
      { key: 'contacted', label: 'Contactados', people: count(REACHED.contactado) },
      { key: 'talking', label: 'En conversación', people: count(REACHED.en_conversacion) },
      { key: 'clients', label: 'Clientes', people: count(REACHED.cliente) },
    ],
    discarded: count(['descartado']),
    byChannel,
  };
}

/* ---------- Everything together, cached for a few minutes ---------- */

export interface FunnelData {
  web: WebFunnel | null;
  webError: string;
  contacts: ContactFunnel | null;
  contactsError: string;
}

const cache = new Map<string, { at: number; data: FunnelData }>();
const TTL = 10 * 60 * 1000;

export async function loadFunnel(
  days: RangeDays,
  channel: Channel | null,
  ga4: Ga4Config | null,
  store: StoreConfig | null,
  now = Date.now(),
): Promise<FunnelData> {
  const key = `${days}:${channel || 'all'}`;
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL) return hit.data;
  const since = new Date(now - days * 24 * 60 * 60 * 1000);
  const [web, contacts] = await Promise.allSettled([
    ga4 ? batchRunReports(ga4, ga4Requests(days, channel)).then(parseGa4) : Promise.resolve(null),
    store
      ? listContactsSince(store, since).then((rows) => summarizeContacts(rows, channel))
      : Promise.resolve(null),
  ]);
  const data: FunnelData = {
    web: web.status === 'fulfilled' ? web.value : null,
    webError: !ga4
      ? 'Falta conectar Google Analytics (GA4_SERVICE_ACCOUNT en Vercel).'
      : web.status === 'rejected'
        ? `Google Analytics no respondió: ${String(web.reason?.message || web.reason).slice(0, 200)}`
        : '',
    contacts: contacts.status === 'fulfilled' ? contacts.value : null,
    contactsError: !store
      ? 'Falta conectar la base de datos.'
      : contacts.status === 'rejected'
        ? 'No se han podido leer los contactos.'
        : '',
  };
  // Only complete answers are cached, so a passing error is retried on the next visit.
  if (!data.webError && !data.contactsError) cache.set(key, { at: now, data });
  return data;
}
