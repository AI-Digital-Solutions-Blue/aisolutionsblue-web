// Meta Conversions API: reports a form lead from the server, alongside the browser pixel. Both
// carry the same event_id (the request id), so Meta counts the lead once. Sent only when the visitor
// accepted advertising cookies; personal data goes hashed (SHA-256), as Meta requires.
import { createHash } from 'node:crypto';
import type { ContactData } from './contact';

const GRAPH_VERSION = 'v27.0';
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export interface LeadContext {
  pixelId: string;
  token: string;
  ip?: string;
  userAgent?: string;
  /** Page where the form was sent. */
  url: string;
  /** Optional Events Manager test code, to see server events in «Probar eventos». */
  testCode?: string;
}

export function leadPayload(data: ContactData, context: LeadContext, now = Date.now()) {
  const phone = data.phone.replace(/\D/g, '');
  const user: Record<string, string | string[]> = { em: [sha256(data.email.toLowerCase())] };
  if (phone.length >= 6) user.ph = [sha256(phone.length === 9 ? `34${phone}` : phone)];
  if (context.ip) user.client_ip_address = context.ip;
  if (context.userAgent) user.client_user_agent = context.userAgent;
  if (data.fbp) user.fbp = data.fbp;
  // A visit that arrived from a Meta ad carries fbclid: the click id is rebuilt if no _fbc exists.
  const fbc =
    data.fbc ||
    (data.attribution.fbclid ? `fb.1.${now}.${data.attribution.fbclid.slice(0, 200)}` : '');
  if (fbc) user.fbc = fbc;
  return {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(now / 1000),
        event_id: data.requestId,
        action_source: 'website',
        event_source_url: context.url,
        user_data: user,
        custom_data: { content_name: data.interest },
      },
    ],
    ...(context.testCode ? { test_event_code: context.testCode } : {}),
  };
}

/** Never throws: a failed report must not affect the visitor's submission. */
export async function sendLead(data: ContactData, context: LeadContext) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(context.pixelId)}/events?access_token=${encodeURIComponent(context.token)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(leadPayload(data, context)),
        signal: AbortSignal.timeout(3000),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}
