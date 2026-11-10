import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  channelOfContact,
  channelOfGroup,
  ga4Requests,
  parseGa4,
  summarizeContacts,
} from '../src/lib/funnel';
import { batchRunReports, ga4Config, rowsOf } from '../src/lib/ga4';
import { generateKeyPairSync } from 'node:crypto';

test('asigna cada contacto a su canal', () => {
  assert.equal(channelOfContact({ source: 'meta_form', attribution: {} }), 'meta');
  assert.equal(channelOfContact({ source: 'web', attribution: { gclid: 'x' } }), 'google_ads');
  assert.equal(
    channelOfContact({ source: 'web', attribution: { utm_source: 'google', utm_medium: 'cpc' } }),
    'google_ads',
  );
  assert.equal(channelOfContact({ source: 'web', attribution: { fbclid: 'x' } }), 'meta');
  assert.equal(
    channelOfContact({ source: 'web', attribution: { utm_source: 'instagram' } }),
    'meta',
  );
  assert.equal(
    channelOfContact({ source: 'web', attribution: { referrer: 'https://www.google.com/' } }),
    'organico',
  );
  assert.equal(
    channelOfContact({ source: 'web', attribution: { landing: '/contacto' } }),
    'directo',
  );
  assert.equal(
    channelOfContact({ source: 'web', attribution: { referrer: 'https://linkedin.com/' } }),
    'otros',
  );
  assert.equal(channelOfContact({ source: 'web', attribution: { utm_source: 'prueba' } }), 'otros');
});

test('traduce los grupos de canales de GA4', () => {
  assert.equal(channelOfGroup('Paid Search'), 'google_ads');
  assert.equal(channelOfGroup('Paid Social'), 'meta');
  assert.equal(channelOfGroup('Organic Social'), 'meta');
  assert.equal(channelOfGroup('Organic Search'), 'organico');
  assert.equal(channelOfGroup('Direct'), 'directo');
  assert.equal(channelOfGroup('Referral'), 'otros');
});

test('cuenta el avance de los contactos por estado y por canal', () => {
  const rows = [
    { source: 'web', status: 'nuevo', attribution: { gclid: 'a' }, created_at: '' },
    { source: 'web', status: 'contactado', attribution: {}, created_at: '' },
    { source: 'meta_form', status: 'en_conversacion', attribution: {}, created_at: '' },
    { source: 'meta_form', status: 'cliente', attribution: {}, created_at: '' },
    { source: 'web', status: 'descartado', attribution: {}, created_at: '' },
  ] as Parameters<typeof summarizeContacts>[0];
  const all = summarizeContacts(rows, null);
  assert.deepEqual(
    all.steps.map((s) => s.people),
    [5, 3, 2, 1],
  );
  assert.equal(all.web, 3);
  assert.equal(all.metaForm, 2);
  assert.equal(all.discarded, 1);
  assert.deepEqual(all.byChannel.meta, { contacts: 2, clients: 1 });
  assert.deepEqual(all.byChannel.google_ads, { contacts: 1, clients: 0 });
  const meta = summarizeContacts(rows, 'meta');
  assert.deepEqual(
    meta.steps.map((s) => s.people),
    [2, 2, 2, 1],
  );
});

test('pide a GA4 el periodo y el canal correctos', () => {
  const [totals, events] = ga4Requests(7, 'meta');
  assert.deepEqual(totals.dateRanges, [{ startDate: '6daysAgo', endDate: 'today' }]);
  assert.match(JSON.stringify(totals.dimensionFilter), /Paid Social/);
  assert.match(JSON.stringify(events.dimensionFilter), /contact_form_start/);
  const others = ga4Requests(30, 'otros')[0];
  assert.match(JSON.stringify(others.dimensionFilter), /notExpression/);
  assert.equal(ga4Requests(30, null)[0].dimensionFilter, undefined);
});

const report = (dims: string[], mets: string[], rows: (string | number)[][]) => ({
  dimensionHeaders: dims.map((name) => ({ name })),
  metricHeaders: mets.map((name) => ({ name })),
  rows: rows.map((row) => ({
    dimensionValues: row.slice(0, dims.length).map((value) => ({ value: String(value) })),
    metricValues: row.slice(dims.length).map((value) => ({ value: String(value) })),
  })),
});

test('convierte los informes de GA4 en el embudo de la web', () => {
  const web = parseGa4([
    report(
      [],
      [
        'totalUsers',
        'sessions',
        'engagementRate',
        'userEngagementDuration',
        'activeUsers',
        'screenPageViewsPerSession',
      ],
      [[200, 260, 0.55, 9000, 150, 2.4]],
    ),
    report(
      ['eventName'],
      ['totalUsers'],
      [
        ['contact_form_view', 80],
        ['contact_form_start', 20],
        ['generate_lead', 6],
      ],
    ),
    report(
      ['pagePath'],
      ['screenPageViews', 'activeUsers', 'userEngagementDuration'],
      [['/', 300, 150, 6000]],
    ),
    report(
      ['deviceCategory'],
      ['totalUsers'],
      [
        ['desktop', 50],
        ['mobile', 150],
      ],
    ),
    report(
      ['sessionDefaultChannelGroup'],
      ['totalUsers'],
      [
        ['Paid Social', 120],
        ['Organic Social', 10],
        ['Direct', 70],
      ],
    ),
  ]);
  assert.deepEqual(
    web.steps.map((s) => s.people),
    [200, 80, 20, 6],
  );
  assert.equal(web.avgEngagementSeconds, 60);
  assert.equal(web.pages[0].avgSeconds, 40);
  assert.deepEqual(web.devices[0], { device: 'Móvil', people: 150 });
  assert.equal(web.visitorsByChannel.meta, 130);
  assert.equal(web.visitorsByChannel.directo, 70);
});

test('un informe vacío no rompe nada', () => {
  const web = parseGa4([]);
  assert.equal(web.visitors, 0);
  assert.equal(web.avgEngagementSeconds, 0);
  assert.deepEqual(rowsOf(undefined), []);
});

test('se autentica con la cuenta de servicio y pide los informes', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('oauth2'))
      return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }));
    return new Response(JSON.stringify({ reports: [report([], ['totalUsers'], [[5]])] }));
  }) as unknown as typeof fetch;
  const reports = await batchRunReports(
    {
      propertyId: '123',
      auth: {
        kind: 'key',
        account: {
          client_email: 'portal@proyecto.iam.gserviceaccount.com',
          private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
        },
      },
      fetch: fetcher,
    },
    ga4Requests(7, null),
  );
  assert.equal(rowsOf(reports[0])[0].totalUsers, 5);
  const assertion = new URLSearchParams(String(calls[0].init.body)).get('assertion') || '';
  assert.equal(assertion.split('.').length, 3);
  assert.match(calls[1].url, /properties\/123:batchRunReports/);
  assert.equal((calls[1].init.headers as Record<string, string>).authorization, 'Bearer tok');
});

test('sin clave: cambia el token de Vercel por uno de la cuenta de servicio', async () => {
  const config = ga4Config(new Headers({ 'x-vercel-oidc-token': 'vercel.jwt.token' }));
  assert.equal(config?.auth.kind, 'oidc');
  assert.equal(config?.propertyId, '561100015');
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('sts.googleapis.com'))
      return new Response(JSON.stringify({ access_token: 'federado', expires_in: 3600 }));
    if (url.includes('iamcredentials'))
      return new Response(
        JSON.stringify({
          accessToken: 'lector',
          expireTime: new Date(Date.now() + 3600_000).toISOString(),
        }),
      );
    return new Response(JSON.stringify({ reports: [report([], ['totalUsers'], [[9]])] }));
  }) as unknown as typeof fetch;
  const reports = await batchRunReports({ ...config!, fetch: fetcher }, ga4Requests(7, null));
  assert.equal(rowsOf(reports[0])[0].totalUsers, 9);
  const sts = JSON.parse(String(calls[0].init.body));
  assert.equal(sts.subjectToken, 'vercel.jwt.token');
  assert.match(sts.audience, /workloadIdentityPools\/vercel\/providers\/vercel$/);
  assert.match(calls[1].url, /portal-embudo%40blue-portal-embudo\.iam\.gserviceaccount\.com:generateAccessToken/);
  assert.equal((calls[1].init.headers as Record<string, string>).authorization, 'Bearer federado');
  assert.equal((calls[2].init.headers as Record<string, string>).authorization, 'Bearer lector');
});

test('sin token de Vercel ni clave, no hay conexión', () => {
  assert.equal(ga4Config(new Headers()), null);
});
