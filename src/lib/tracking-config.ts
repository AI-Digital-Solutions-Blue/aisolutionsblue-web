// Measurement IDs, set as public environment variables in Vercel (and in .env for local work).
// None is invented here: while a value is missing, its tag simply never loads, and with no tag
// configured at all the cookie banner does not appear either.
//   PUBLIC_META_PIXEL_ID          Meta pixel, e.g. 1234567890123456
//   PUBLIC_GA4_ID                 Google Analytics 4, e.g. G-XXXXXXXXXX
//   PUBLIC_GADS_ID                Google Ads account tag, e.g. AW-123456789
//   PUBLIC_GADS_LEAD_LABEL        conversion label of «envío de formulario»
//   PUBLIC_GADS_WHATSAPP_LABEL    conversion label of «clic en WhatsApp» (secondary)
// The Conversions API token (META_CAPI_TOKEN) is a server secret and is read only in the API route.
const value = (raw: string | undefined) => (raw || '').trim();

export const tracking = {
  metaPixelId: value(import.meta.env.PUBLIC_META_PIXEL_ID),
  ga4Id: value(import.meta.env.PUBLIC_GA4_ID),
  adsId: value(import.meta.env.PUBLIC_GADS_ID),
  adsLeadLabel: value(import.meta.env.PUBLIC_GADS_LEAD_LABEL),
  adsWhatsappLabel: value(import.meta.env.PUBLIC_GADS_WHATSAPP_LABEL),
};

/** True when at least one tag is configured, so there is something to ask consent for. */
export const hasTracking = Boolean(tracking.metaPixelId || tracking.ga4Id || tracking.adsId);
