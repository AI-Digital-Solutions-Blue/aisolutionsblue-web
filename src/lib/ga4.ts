// Read-only access to Blue's Google Analytics 4 property (Data API), from the server.
// The reader is the Google Cloud service account «portal-embudo», with Viewer access to the
// property. On Vercel there is no key: the deployment's OIDC token (Vercel ↔ Google Workload
// Identity Federation, pool «vercel» of project blue-portal-embudo) is exchanged for a Google token
// that impersonates the service account. A JSON key (GA4_SERVICE_ACCOUNT) is still accepted, for
// local use. No SDK: plain HTTPS calls.
import { createSign } from 'node:crypto';
import { serverEnv } from './server-env';

/** Property «aisolutionsblue.com» (stream G-Y4TPKG7P83). Public identifier, not a secret. */
const DEFAULT_PROPERTY = '561100015';
/** Public identifiers of the keyless setup in Google Cloud (project blue-portal-embudo). */
const DEFAULT_READER = 'portal-embudo@blue-portal-embudo.iam.gserviceaccount.com';
const DEFAULT_PROVIDER =
  '//iam.googleapis.com/projects/901939333089/locations/global/workloadIdentityPools/vercel/providers/vercel';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export type Ga4Auth =
  | { kind: 'key'; account: ServiceAccount }
  | { kind: 'oidc'; oidcToken: string; serviceAccount: string; provider: string };

export interface Ga4Config {
  propertyId: string;
  auth: Ga4Auth;
  fetch?: typeof fetch;
}

/**
 * Reads the configuration. `headers` are the request's: on Vercel they carry the deployment's
 * OIDC token (x-vercel-oidc-token). Null when there is no way to authenticate.
 */
export function ga4Config(headers?: Headers): Ga4Config | null {
  const propertyId = serverEnv('GA4_PROPERTY_ID') || DEFAULT_PROPERTY;
  const raw = serverEnv('GA4_SERVICE_ACCOUNT');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
      if (parsed.client_email && parsed.private_key)
        return {
          propertyId,
          // Keys pasted with literal "\n" sequences are normalised to real line breaks.
          auth: {
            kind: 'key',
            account: {
              client_email: parsed.client_email,
              private_key: parsed.private_key.replace(/\\n/g, '\n'),
            },
          },
        };
    } catch {
      // Not valid JSON: fall through to the keyless setup.
    }
  }
  const oidcToken = headers?.get('x-vercel-oidc-token') || serverEnv('VERCEL_OIDC_TOKEN');
  if (!oidcToken) return null;
  return {
    propertyId,
    auth: {
      kind: 'oidc',
      oidcToken,
      serviceAccount: serverEnv('GA4_SERVICE_ACCOUNT_EMAIL') || DEFAULT_READER,
      provider: serverEnv('GA4_WIF_PROVIDER') || DEFAULT_PROVIDER,
    },
  };
}

const base64url = (value: string) => Buffer.from(value).toString('base64url');
let cachedToken: { value: string; expires: number; who: string } | null = null;

const identity = (auth: Ga4Auth) =>
  auth.kind === 'key' ? `key:${auth.account.client_email}` : `oidc:${auth.serviceAccount}`;

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as T;
}

async function accessToken(config: Ga4Config, now = Date.now()) {
  const who = identity(config.auth);
  if (cachedToken && cachedToken.who === who && cachedToken.expires > now) return cachedToken.value;
  const token =
    config.auth.kind === 'key'
      ? await keyToken(config, config.auth.account, now)
      : await oidcToken(config, config.auth);
  cachedToken = {
    value: token.value,
    expires: now + Math.max(60, token.seconds - 120) * 1000,
    who,
  };
  return token.value;
}

/** Vercel's OIDC token → federated Google token (STS) → token of the service account. */
async function oidcToken(config: Ga4Config, auth: Extract<Ga4Auth, { kind: 'oidc' }>) {
  const http = config.fetch || fetch;
  const sts = await http('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
      audience: auth.provider,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
      subjectToken: auth.oidcToken,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const federated = await readJson<{ access_token?: string; error_description?: string }>(sts);
  if (!sts.ok || !federated.access_token)
    throw new Error(`Google STS: ${federated.error_description || sts.status}`);
  const impersonate = await http(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(auth.serviceAccount)}:generateAccessToken`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${federated.access_token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ scope: [SCOPE], lifetime: '3600s' }),
      signal: AbortSignal.timeout(8000),
    },
  );
  const result = await readJson<{
    accessToken?: string;
    expireTime?: string;
    error?: { message?: string };
  }>(impersonate);
  if (!impersonate.ok || !result.accessToken)
    throw new Error(`Google IAM: ${result.error?.message || impersonate.status}`);
  const seconds = result.expireTime
    ? Math.floor((Date.parse(result.expireTime) - Date.now()) / 1000)
    : 3600;
  return { value: result.accessToken, seconds: Number.isFinite(seconds) ? seconds : 3600 };
}

/** JSON key → signed JWT → token. */
async function keyToken(config: Ga4Config, account: ServiceAccount, now: number) {
  const issued = Math.floor(now / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: issued,
      exp: issued + 3600,
    }),
  );
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${claims}`)
    .sign(account.private_key, 'base64url');
  const response = await (config.fetch || fetch)('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const result = await readJson<{
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  }>(response);
  if (!response.ok || !result.access_token)
    throw new Error(result.error_description || `Google ${response.status}`);
  return { value: result.access_token, seconds: result.expires_in || 3600 };
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
