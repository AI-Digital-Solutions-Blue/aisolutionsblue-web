// Where a contact came from: the campaign parameters and click identifiers of the visit, attached
// to each form submission. Shared by the browser (which collects them) and the server (which
// cleans them before they reach the email or any other system).

export const ATTRIBUTION_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'landing',
  'referrer',
] as const;

export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number];
export type Attribution = Partial<Record<AttributionField, string>>;

/** Fields read straight from the landing URL. */
export const URL_FIELDS = ATTRIBUTION_FIELDS.filter(
  (field) => field !== 'landing' && field !== 'referrer',
);

/** Trims, drops control characters and caps the length; empty values are left out. */
export function cleanAttribution(get: (key: string) => string | null | undefined): Attribution {
  const out: Attribution = {};
  for (const field of ATTRIBUTION_FIELDS) {
    const max = field === 'landing' || field === 'referrer' ? 500 : 300;
    const raw = (get(field) || '').replace(/[\x00-\x1f\x7f]/g, '').trim();
    if (raw) out[field] = raw.slice(0, max);
  }
  return out;
}

/** Meta browser identifiers (_fbp, _fbc), accepted only in their documented shape. */
export function cleanMetaId(value: string | null | undefined) {
  const raw = (value || '').trim();
  return /^fb\.\d\.\d{10,13}\.[\w.-]{1,200}$/.test(raw) ? raw : '';
}

export function describeAttribution(attribution: Attribution) {
  const labels: Record<AttributionField, string> = {
    utm_source: 'Fuente',
    utm_medium: 'Medio',
    utm_campaign: 'Campaña',
    utm_content: 'Anuncio',
    utm_term: 'Término',
    gclid: 'Clic de Google (gclid)',
    fbclid: 'Clic de Meta (fbclid)',
    landing: 'Página de entrada',
    referrer: 'Llegó desde',
  };
  return ATTRIBUTION_FIELDS.filter((field) => attribution[field]).map(
    (field) => `${labels[field]}: ${attribution[field]}`,
  );
}
