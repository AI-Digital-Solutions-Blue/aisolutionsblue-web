import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUTO_NOTE, syncMetaSpend, TODAY_NOTE, toSpendLines } from '../src/lib/meta-ads';
import {
  listSpend,
  parseSpend,
  saveSpend,
  summarizeSpend,
  type AdSpend,
} from '../src/lib/ad-spend';

const form = (values: Record<string, string>) => new URLSearchParams(values);

test('valida una línea de gasto y entiende la coma decimal', () => {
  assert.deepEqual(
    parseSpend(
      form({
        platform: 'meta',
        campaign: ' Clientes potenciales · Web ',
        ad: 'D3-AUTO',
        date_from: '2026-11-09',
        date_to: '2026-11-10',
        amount: '15,87 €',
      }),
    ),
    {
      platform: 'meta',
      campaign: 'Clientes potenciales · Web',
      ad: 'D3-AUTO',
      date_from: '2026-11-09',
      date_to: '2026-11-10',
      amount: 15.87,
      notes: null,
    },
  );
  const base = { platform: 'meta', campaign: 'C', date_from: '2026-11-09', amount: '1' };
  assert.equal(parseSpend(form({ ...base, platform: 'tiktok' })), 'platform');
  assert.equal(parseSpend(form({ ...base, campaign: '' })), 'campaign');
  assert.equal(parseSpend(form({ ...base, date_from: '9/11/2026' })), 'dates');
  assert.equal(parseSpend(form({ ...base, date_to: '2026-11-01' })), 'order');
  assert.equal(parseSpend(form({ ...base, amount: '-3' })), 'amount');
  // Without an end date, the line is for a single day.
  assert.equal((parseSpend(form(base)) as { date_to: string }).date_to, '2026-11-09');
});

const row = (
  platform: 'meta' | 'google',
  campaign: string,
  amount: number | string,
  from: string,
  to = from,
) =>
  ({
    id: from + campaign + amount,
    platform,
    campaign,
    ad: '',
    date_from: from,
    date_to: to,
    amount,
    notes: null,
    updated_at: null,
  }) as AdSpend;

test('suma la inversión por plataforma y por campaña', () => {
  const summary = summarizeSpend([
    row('meta', 'Web', 15.87, '2026-11-09', '2026-11-10'),
    row('meta', 'Form', '17.41', '2026-11-09', '2026-11-10'),
    row('meta', 'Form', 9.53, '2026-11-11'),
    row('google', 'Campaña #1', 0, '2026-11-11'),
  ]);
  assert.equal(summary.total, 42.81);
  assert.deepEqual(summary.byPlatform, { meta: 42.81, google: 0 });
  assert.equal(summary.campaigns[0].campaign, 'Form');
  assert.equal(summary.campaigns[0].total, 26.94);
  assert.equal(summary.from, '2026-11-09');
  assert.equal(summary.to, '2026-11-11');
});

test('guarda sobrescribiendo el mismo anuncio y periodo, y lista desde una fecha', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(init.method === 'POST' ? null : '[]', {
      status: init.method === 'POST' ? 201 : 200,
    });
  }) as unknown as typeof fetch;
  const config = { url: 'https://x.supabase.co', key: 'sb_secret_x', fetch: fetcher };
  await saveSpend(config, {
    platform: 'meta',
    campaign: 'Web',
    ad: 'D3',
    date_from: '2026-11-11',
    date_to: '2026-11-11',
    amount: 0.05,
    notes: null,
  });
  assert.match(calls[0].url, /ad_spend\?on_conflict=platform,campaign,ad,date_from,date_to/);
  assert.match((calls[0].init.headers as Record<string, string>).prefer, /merge-duplicates/);
  await listSpend(config, '2026-10-13');
  assert.match(calls[1].url, /date_to=gte\.2026-10-13/);
});

test('convierte las estadísticas de Meta en líneas por anuncio y día', () => {
  const lines = toSpendLines(
    [
      { campaign_name: 'Web', ad_name: 'D3-AUTO', spend: '7.93', date_start: '2026-11-09' },
      { campaign_name: 'Web', ad_name: 'D3-AUTO', spend: '7.94', date_start: '2026-11-10' },
      { campaign_name: 'Web', ad_name: 'D3', spend: '0', date_start: '2026-11-10' },
      { campaign_name: 'Form', ad_name: 'D3-AUTO', spend: '9.53', date_start: '2026-11-11' },
    ],
    '2026-11-11',
  );
  assert.equal(lines.length, 3);
  assert.deepEqual(
    lines.map((l) => [l.ad, l.date_from, l.amount, l.notes]),
    [
      ['D3-AUTO', '2026-11-09', 7.93, AUTO_NOTE],
      ['D3-AUTO', '2026-11-10', 7.94, AUTO_NOTE],
      ['D3-AUTO', '2026-11-11', 9.53, TODAY_NOTE],
    ],
  );
});

test('sincroniza con Meta y quita las líneas de Meta que ya no cuadran', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetcher = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.startsWith('https://graph.facebook.com'))
      return new Response(
        JSON.stringify({
          data: [
            { campaign_name: 'Web', ad_name: 'D3-AUTO', spend: '7.93', date_start: '2026-11-09' },
          ],
        }),
      );
    if (init?.method === 'POST' || init?.method === 'DELETE')
      return new Response(null, { status: 204 });
    return new Response(
      JSON.stringify([
        {
          id: 'keep',
          campaign: 'Web',
          ad: 'D3-AUTO',
          date_from: '2026-11-09',
          date_to: '2026-11-09',
        },
        {
          id: 'old-manual',
          campaign: 'Web',
          ad: 'D3-AUTO',
          date_from: '2026-11-09',
          date_to: '2026-11-10',
        },
      ]),
    );
  }) as unknown as typeof fetch;
  const result = await syncMetaSpend(
    { token: 'tok', appSecret: 'secret', accountId: '123', fetch: fetcher },
    { url: 'https://x.supabase.co', key: 'sb_secret_x', fetch: fetcher },
    7,
    new Date('2026-11-11T12:00:00Z'),
  );
  assert.deepEqual(result, { saved: 1, removed: 1, since: '2026-11-05', until: '2026-11-11' });
  const insights = new URL(calls[0].url);
  assert.equal(insights.pathname, '/v27.0/act_123/insights');
  assert.equal(insights.searchParams.get('level'), 'ad');
  assert.equal(insights.searchParams.get('time_increment'), '1');
  assert.ok(insights.searchParams.get('appsecret_proof'));
  assert.match(calls[1].url, /on_conflict=platform,campaign,ad,date_from,date_to/);
  assert.match(calls[2].url, /platform=eq\.meta/);
  assert.match(calls[3].url, /id=in\.\(old-manual\)/);
  assert.equal(calls[3].init?.method, 'DELETE');
});
