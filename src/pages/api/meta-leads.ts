// Webhook for Meta instant-form leads (Page object, "leadgen" field).
// GET answers Meta's subscription check; POST receives each lead, reads it from the Graph API,
// stores it in the contacts portal once per leadgen_id and emails the team.
import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { brevoConfig, sendEmail } from '../../lib/brevo';
import { hasMetaLead, insertContact, storeConfig } from '../../lib/contacts-store';
import {
  fetchLead,
  leadNotices,
  leadToContact,
  metaLeadEmail,
  validSignature,
} from '../../lib/meta-leads';
import { serverEnv } from '../../lib/server-env';

export const prerender = false;
const MAX_BODY = 512 * 1024;
const plain = (status: number, body = '') =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const sameText = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export const GET: APIRoute = ({ url }) => {
  const token = serverEnv('META_WEBHOOK_VERIFY_TOKEN');
  const mode = url.searchParams.get('hub.mode');
  const sent = url.searchParams.get('hub.verify_token') || '';
  const challenge = url.searchParams.get('hub.challenge') || '';
  if (token && mode === 'subscribe' && sameText(sent, token) && /^[\w-]{1,200}$/.test(challenge))
    return plain(200, challenge);
  return plain(403);
};

export const POST: APIRoute = async ({ request }) => {
  const appSecret = serverEnv('META_APP_SECRET');
  const pageToken = serverEnv('META_PAGE_TOKEN');
  const store = storeConfig();
  if (!appSecret || !pageToken || !store) return plain(503);
  if (Number(request.headers.get('content-length')) > MAX_BODY) return plain(413);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return plain(413);
  if (!validSignature(raw, request.headers.get('x-hub-signature-256'), appSecret))
    return plain(401);
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return plain(400);
  }
  const mail = brevoConfig();
  let failed = false;
  for (const notice of leadNotices(payload)) {
    try {
      if (await hasMetaLead(store, notice.leadgen_id)) continue;
      const contact = leadToContact(
        await fetchLead(notice.leadgen_id, pageToken, appSecret),
        notice,
      );
      // Only a new row emails the team: a retried notice is stored and announced once.
      if ((await insertContact(store, contact)) && mail)
        await sendEmail(mail, metaLeadEmail(contact));
    } catch {
      failed = true;
    }
  }
  // A non-2xx answer makes Meta retry later; leads already stored are skipped on the retry.
  return plain(failed ? 500 : 200, failed ? '' : 'ok');
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'GET, POST', 'Cache-Control': 'no-store' } });
