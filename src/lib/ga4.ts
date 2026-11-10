// Read-only access to Blue's Google Analytics 4 property (Data API), from the server.
// Authenticates as a Google Cloud service account (GA4_SERVICE_ACCOUNT, the JSON key, kept in
// Vercel) that has Viewer access to the property. No SDK: a signed JWT is exchanged for a token.
import { createSign } from 'node:crypto';
import { serverEnv } from './server-env';

/** Property «aisolutionsblue.com» (stream G-Y4TPKG7P83). Public identifier, not a secret. */
const DEFAULT_PROPERTY = '561100015';

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export interface Ga4Config {
  propertyId: string;
  account: ServiceAccount;
  fetch?: typeof fetch;
}

export function ga4Config(): Ga4Config | null {
  const raw = serverEnv('GA4_SERVICE_ACCOUNT');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return {
      propertyId: serverEnv('GA4_PROPERTY_ID') || DEFAULT_PROPERTY,
      // Keys pasted with literal "\n" sequences are normalised to real line breaks.
      account: {
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, '\n'),
      },
    };
  } catch {
    return null;
  }
}

const base64url = (value: string) => Buffer.from(value).toString('base64url');
let cachedToken: { value: string; expires: number; email: string } | null = null;

async function accessToken(config: Ga4Config, now = Date.now()) {
  if (cachedToken && cachedToken.email === config.account.client_email && cachedToken.expires > now)
    return cachedToken.value;
  const issued = Math.floor(now / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: config.account.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: issued,
      exp: issued + 3600,
    }),
  );
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${claims}`)
    .sign(config.account.private_key, 'base64url');
  const response = await (config.fetch || fetch)('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const result = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !result.access_token)
    throw new Error(result.error_description || `Google ${response.status}`);
  cachedToken = {
    value: result.access_token,
    expires: now + Math.max(60, (result.expires_in || 3600) - 120) * 1000,
    email: config.account.client_email,
  };
  return cachedToken.value;
}

export interface ReportRequest {
  dateRanges: { startDate: string; endDate: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  dimensionFilter?: unknown;
  orderBys?: unknown[];
  limit?: number;
}

export interface ReportResponse {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
}

/** Runs up to five reports in one call. Throws with Google's message when it fails. */
export async function batchRunReports(config: Ga4Config, requests: ReportRequest[]) {
  const token = await accessToken(config);
  const response = await (config.fetch || fetch)(
    `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:batchRunReports`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ requests }),
      signal: AbortSignal.timeout(10000),
    },
  );
  const result = (await response.json().catch(() => ({}))) as {
    reports?: ReportResponse[];
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(result.error?.message || `Google Analytics ${response.status}`);
  return result.reports || [];
}

/** Rows of a report as plain objects: { dimensionName: value, metricName: number }. */
export function rowsOf(report: ReportResponse | undefined) {
  if (!report) return [];
  const dims = (report.dimensionHeaders || []).map((h) => h.name);
  const mets = (report.metricHeaders || []).map((h) => h.name);
  return (report.rows || []).map((row) => {
    const out: Record<string, string | number> = {};
    dims.forEach((name, i) => (out[name] = row.dimensionValues?.[i]?.value ?? ''));
    mets.forEach((name, i) => (out[name] = Number(row.metricValues?.[i]?.value ?? 0)));
    return out;
  });
}
