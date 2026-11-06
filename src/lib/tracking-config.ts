// Measurement IDs. They are public (they appear in every page's source), so Blue's own IDs are the
// defaults below; an environment variable overrides one, and an empty one turns that tag off.
// While a value is missing its tag never loads, and with no tag at all the cookie banner is hidden.
//   Meta pixel  «aisolutionsblue.com – web», portfolio AIsolutionsblue (1449498430569551)
//   GA4         property «AI Digital Solutions Blue – web» (561100015), stream aisolutionsblue.com
//   PUBLIC_META_PIXEL_ID          Meta pixel, e.g. 1234567890123456
//   PUBLIC_GA4_ID                 Google Analytics 4, e.g. G-XXXXXXXXXX
//   PUBLIC_GADS_ID                Google Ads account tag, e.g. AW-123456789
//   PUBLIC_GADS_LEAD_LABEL        conversion label of «envío de formulario»
//   PUBLIC_GADS_WHATSAPP_LABEL    conversion label of «clic en WhatsApp» (secondary)
// The Conversions API token (META_CAPI_TOKEN) is a server secret and is read only in the API route.
const value = (raw: string | undefined, fallback = '') => (raw ?? fallback).trim();

export const tracking = {
  metaPixelId: value(import.meta.env.PUBLIC_META_PIXEL_ID, '1639021901290433'),
  ga4Id: value(import.meta.env.PUBLIC_GA4_ID, 'G-Y4TPKG7P83'),
  adsId: value(import.meta.env.PUBLIC_GADS_ID),
  adsLeadLabel: value(import.meta.env.PUBLIC_GADS_LEAD_LABEL),
  adsWhatsappLabel: value(import.meta.env.PUBLIC_GADS_WHATSAPP_LABEL),
};

/** True when at least one tag is configured, so there is something to ask consent for. */
export const hasTracking = Boolean(tracking.metaPixelId || tracking.ga4Id || tracking.adsId);
