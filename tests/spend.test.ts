import { test } from 'node:test';
import assert from 'node:assert/strict';
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
