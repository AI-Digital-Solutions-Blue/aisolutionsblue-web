import './motion';
import './signal';

// Native links, details and forms remain usable when JavaScript is unavailable.
const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const navigation = document.querySelector<HTMLElement>('#main-navigation');
function closeMenu(restoreFocus = false) {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menú');
  navigation?.classList.remove('is-open');
  if (restoreFocus) menuButton?.focus();
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  navigation?.classList.toggle('is-open', open);
});
navigation
  ?.querySelectorAll('a')
  .forEach((link) => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true')
    closeMenu(true);
});
document.addEventListener('click', (event) => {
  if (
    event.target instanceof Node &&
    !document.querySelector('.site-header')?.contains(event.target)
  )
    closeMenu();
});
matchMedia('(min-width: 641px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

const allowMotion = matchMedia('(min-width: 801px) and (prefers-reduced-motion: no-preference)');
const activeAnimations = new Set<Animation>();
function animateDetail(element: Element, keyframes: Keyframe[], duration: number) {
  if (!allowMotion.matches) return;
  const animation = element.animate(keyframes, { duration, easing: 'ease-out' });
  activeAnimations.add(animation);
  animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
}
allowMotion.addEventListener('change', () => {
  if (!allowMotion.matches) activeAnimations.forEach((animation) => animation.cancel());
});
document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
  const images: string[] = JSON.parse(gallery.dataset.images || '[]');
  const alts: string[] = JSON.parse(gallery.dataset.alts || '[]');
  const image = gallery.querySelector<HTMLImageElement>('.project-image');
  const counter = gallery.querySelector<HTMLElement>('[data-gallery-index]');
  const status = gallery.querySelector<HTMLElement>('[data-gallery-status]');
  let index = 0;
  let requestedIndex = 0;
  let request = 0;
  const change = async (direction: number) => {
    if (!image || images.length < 2) return;
    requestedIndex = (requestedIndex + direction + images.length) % images.length;
    const nextIndex = requestedIndex;
    const currentRequest = ++request;
    const next = new Image();
    next.src = images[nextIndex];
    try {
      await next.decode();
      if (currentRequest !== request) return;
      image.src = images[nextIndex];
      image.alt = alts[nextIndex];
      index = nextIndex;
      if (counter) counter.textContent = String(index + 1).padStart(2, '0');
      if (status) status.textContent = '';
      image.getAnimations().forEach((animation) => animation.cancel());
      animateDetail(image, [{ opacity: 0.75 }, { opacity: 1 }], 180);
    } catch {
      if (currentRequest !== request) return;
      requestedIndex = index;
      if (status) status.textContent = 'No se ha podido cargar la imagen. Vuelve a intentarlo.';
    }
  };
  gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => change(-1));
  gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => change(1));
});

const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
if (form) {
  let requestId = crypto.randomUUID();
  let submitting = false;
  form.addEventListener('input', () => {
    if (!submitting) requestId = crypto.randomUUID();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    const button = form.querySelector<HTMLButtonElement>('[type=submit]')!;
    const label = form.querySelector<HTMLElement>('[data-submit-label]')!;
    const status = form.querySelector<HTMLElement>('.form-status')!;
    submitting = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    label.textContent = 'Enviando tu consulta…';
    status.hidden = true;
    try {
      const data = new URLSearchParams();
      new FormData(form).forEach((value, key) => {
        if (typeof value === 'string') data.append(key, value);
      });
      data.set('requestId', requestId);
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No hemos podido enviar tu consulta.');
      status.dataset.state = 'success';
      status.textContent =
        '¡Gracias! Hemos recibido tu consulta. Nuestro equipo se pondrá en contacto contigo.';
      form.reset();
      requestId = crypto.randomUUID();
    } catch (error) {
      status.dataset.state = 'error';
      const message =
        error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'TypeError'
          ? error.message
          : 'No hemos podido confirmar el envío. Puedes volver a intentarlo.';
      status.textContent = `${message} También puedes escribirnos a `;
      const fallback = document.createElement('a');
      fallback.href = 'mailto:marketing@aisolutionsblue.com';
      fallback.textContent = 'marketing@aisolutionsblue.com';
      status.append(fallback, '.');
    } finally {
      submitting = false;
      button.disabled = false;
      label.textContent = 'Hablemos de tu proyecto';
      form.removeAttribute('aria-busy');
      status.hidden = false;
      status.focus({ preventScroll: true });
    }
  });
}

// Section position informs navigation; it never controls reading speed or text visibility.
const sectionLinks = [...(navigation?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') || [])];
const sections = sectionLinks
  .map((link) => document.querySelector<HTMLElement>(link.hash))
  .filter((section): section is HTMLElement => !!section);
if (sections.length) {
  let scheduled = false;
  const updateSection = () => {
    scheduled = false;
    const active = sections.filter((section) => section.getBoundingClientRect().top <= 160).at(-1);
    sectionLinks.forEach((link) => {
      if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateSection);
      }
    },
    { passive: true },
  );
  updateSection();
}
