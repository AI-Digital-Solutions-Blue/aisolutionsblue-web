// Measurement with consent (RGPD/LSSI). Nothing from Google or Meta loads until the visitor accepts:
// the choice is kept in a first-party cookie (blue_consent), and Google receives it through Consent
// Mode v2. Events: page views, Lead when the contact form is sent, Contact on a WhatsApp or email
// click. The campaign parameters of the visit (UTM, gclid, fbclid) travel with each form.
import { tracking } from '../lib/tracking-config';
import { URL_FIELDS, type Attribution } from '../lib/attribution';

type Consent = { analytics: boolean; ads: boolean };
type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { callMethod?: Function; queue?: unknown[][] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
    blueTracking?: {
      /** Fields to send with the contact form: attribution, consent and Meta browser ids. */
      formFields: () => Record<string, string>;
      /** The contact form was received by the server. */
      lead: (eventId: string, interest?: string) => void;
    };
  }
}

const COOKIE = 'blue_consent';
const VERSION = '1';
const MAX_AGE = 60 * 60 * 24 * 180; // Six months, then the choice is asked again.
const ATTRIBUTION_KEY = 'blue_attribution';

const banner = document.querySelector<HTMLElement>('[data-consent]');

/* ---------- The stored choice ---------- */

function readConsent(): Consent | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE}=v${VERSION}\\.([01])\\.([01])\\.\\d+`),
  );
  return match ? { analytics: match[1] === '1', ads: match[2] === '1' } : null;
}

function writeConsent(consent: Consent) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=v${VERSION}.${+consent.analytics}.${+consent.ads}.${Date.now()}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/** Removes the cookies the tags may have set, on this host and on the parent domain. */
function clearTagCookies() {
  const host = location.hostname;
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0];
    if (!/^(_ga|_gid|_gcl|_fbp|_fbc)/.test(name)) continue;
    for (const domain of domains)
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
  }
}

/* ---------- Where the visit came from ---------- */

function currentTouch(): Attribution {
  const params = new URLSearchParams(location.search);
  const touch: Attribution = {};
  for (const field of URL_FIELDS) {
    const value = params.get(field);
    if (value) touch[field] = value.slice(0, 300);
  }
  touch.landing = `${location.pathname}${location.search}`.slice(0, 500);
  if (document.referrer && new URL(document.referrer).host !== location.host)
    touch.referrer = document.referrer.slice(0, 500);
  return touch;
}

const fromCampaign = (touch: Attribution) =>
  URL_FIELDS.some((field) => touch[field]) || Boolean(touch.referrer);

/**
 * First touch of the visit. Kept across pages only with consent (in sessionStorage, gone when the
 * tab closes); without it, the form still carries the parameters of the page it is sent from.
 */
function attribution(consent: Consent | null): Attribution {
  const touch = currentTouch();
  if (!consent || (!consent.analytics && !consent.ads)) return touch;
  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (stored) return JSON.parse(stored) as Attribution;
    if (fromCampaign(touch)) sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(touch));
  } catch {
    // Storage unavailable (private mode): the current page's parameters are used.
  }
  return touch;
}

const readCookie = (name: string) =>
  document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] || '';

/* ---------- The tags, loaded only after consent ---------- */

let googleLoaded = false;
let metaLoaded = false;

function loadScript(src: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function googleConsent(consent: Consent) {
  const ads = consent.ads ? 'granted' : 'denied';
  return {
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: consent.analytics ? 'granted' : 'denied',
  };
}

function loadGoogle(consent: Consent) {
  const useAnalytics = consent.analytics && tracking.ga4Id;
  const useAds = consent.ads && tracking.adsId;
  if (googleLoaded || (!useAnalytics && !useAds)) return;
  googleLoaded = true;
  window.dataLayer = window.dataLayer || [];
  // gtag must push the arguments object itself, as Google's snippet does.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  const gtag = window.gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
  gtag('consent', 'update', googleConsent(consent));
  gtag('js', new Date());
  if (useAnalytics) gtag('config', tracking.ga4Id);
  if (useAds) gtag('config', tracking.adsId);
  loadScript(
    `https://www.googletagmanager.com/gtag/js?id=${useAnalytics ? tracking.ga4Id : tracking.adsId}`,
  );
}

function loadMeta(consent: Consent) {
  if (metaLoaded || !consent.ads || !tracking.metaPixelId) return;
  metaLoaded = true;
  // Meta's standard pixel stub: queues calls until fbevents.js arrives.
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  } as Fbq;
  Object.assign(fbq, { push: fbq, loaded: true, version: '2.0', queue: [] });
  window.fbq = fbq;
  window._fbq = fbq;
  loadScript('https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', tracking.metaPixelId);
  fbq('track', 'PageView');
}

function apply(consent: Consent) {
  loadGoogle(consent);
  loadMeta(consent);
  window.gtag?.('consent', 'update', googleConsent(consent));
}

/* ---------- Events ---------- */

function lead(eventId: string, interest = '') {
  const consent = readConsent();
  if (!consent) return;
  if (consent.ads) window.fbq?.('track', 'Lead', { content_name: interest }, { eventID: eventId });
  if (consent.analytics) window.gtag?.('event', 'generate_lead', { method: 'contact_form' });
  if (consent.ads && tracking.adsId && tracking.adsLeadLabel)
    window.gtag?.('event', 'conversion', {
      send_to: `${tracking.adsId}/${tracking.adsLeadLabel}`,
      transaction_id: eventId,
    });
}

function contact(channel: 'whatsapp' | 'email') {
  const consent = readConsent();
  if (!consent) return;
  if (consent.ads) window.fbq?.('track', 'Contact', { content_name: channel });
  if (consent.analytics) window.gtag?.('event', 'contact', { method: channel });
  if (channel === 'whatsapp' && consent.ads && tracking.adsId && tracking.adsWhatsappLabel)
    window.gtag?.('event', 'conversion', {
      send_to: `${tracking.adsId}/${tracking.adsWhatsappLabel}`,
    });
}

/**
 * Funnel steps of the contact form, for analytics only: the form came into view, and the visitor
 * started filling it in. Each is sent once per page; if consent arrives later, the next one counts.
 */
function trackContactForms() {
  const send = (name: string) => {
    if (!readConsent()?.analytics || !window.gtag) return false;
    window.gtag('event', name, { form_location: location.pathname });
    return true;
  };
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-contact-form]')) {
    let viewed = false;
    let started = false;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (viewed || !entries.some((entry) => entry.isIntersecting)) return;
          viewed = send('contact_form_view');
          if (viewed) observer.disconnect();
        },
        { threshold: 0.4 },
      );
      observer.observe(form);
    }
    form.addEventListener('focusin', () => {
      if (!started) started = send('contact_form_start');
    });
  }
}

trackContactForms();

document.addEventListener('click', (event) => {
  const link = event.target instanceof Element ? event.target.closest('a') : null;
  if (!link) return;
  const href = link.getAttribute('href') || '';
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) contact('whatsapp');
  else if (href.startsWith('mailto:')) contact('email');
});

window.blueTracking = {
  formFields() {
    const consent = readConsent();
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(attribution(consent))) if (value) fields[key] = value;
    if (consent?.ads) {
      fields.consent_ads = 'yes';
      const fbp = readCookie('_fbp');
      const fbc = readCookie('_fbc');
      if (fbp) fields.fbp = fbp;
      if (fbc) fields.fbc = fbc;
    }
    return fields;
  },
  lead,
};

/* ---------- The banner ---------- */

function setupBanner() {
  if (!banner) return;
  const panel = banner.querySelector<HTMLElement>('[data-consent-panel]')!;
  const analyticsBox = banner.querySelector<HTMLInputElement>('[data-consent-analytics]')!;
  const adsBox = banner.querySelector<HTMLInputElement>('[data-consent-ads]')!;
  const configure = banner.querySelector<HTMLButtonElement>('[data-consent-configure]')!;

  const open = (withPanel = false) => {
    const current = readConsent();
    analyticsBox.checked = current?.analytics ?? false;
    adsBox.checked = current?.ads ?? false;
    panel.hidden = !withPanel;
    configure.setAttribute('aria-expanded', String(withPanel));
    banner.hidden = false;
  };
  const choose = (consent: Consent) => {
    const before = readConsent();
    writeConsent(consent);
    banner.hidden = true;
    // Withdrawing consent: the tags already running cannot be unloaded, so the page reloads clean.
    const withdrawn = (before?.analytics && !consent.analytics) || (before?.ads && !consent.ads);
    if (withdrawn) {
      clearTagCookies();
      location.reload();
      return;
    }
    if (consent.analytics || consent.ads) attribution(consent);
    apply(consent);
  };

  banner
    .querySelector('[data-consent-accept]')!
    .addEventListener('click', () => choose({ analytics: true, ads: true }));
  banner
    .querySelector('[data-consent-reject]')!
    .addEventListener('click', () => choose({ analytics: false, ads: false }));
  banner
    .querySelector('[data-consent-save]')!
    .addEventListener('click', () =>
      choose({ analytics: analyticsBox.checked, ads: adsBox.checked }),
    );
  configure.addEventListener('click', () => {
    const show = panel.hidden;
    panel.hidden = !show;
    configure.setAttribute('aria-expanded', String(show));
  });
  document
    .querySelectorAll('[data-consent-open]')
    .forEach((button) => button.addEventListener('click', () => open(true)));

  const consent = readConsent();
  if (consent) apply(consent);
  else open();
}

setupBanner();
