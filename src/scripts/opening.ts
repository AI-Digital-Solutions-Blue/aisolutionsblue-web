// Opening of the home page. Content is complete in the HTML; this script only adds motion on top
// (the reel has its own script, src/scripts/reel.ts).
import { gsap } from 'gsap';

// Development only: lets the browser inspector drive the timelines frame by frame.
if (import.meta.env.DEV) (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;

const root = document.documentElement;

/* ---------- Dark opening: the header turns to night glass while it sits over it ---------- */

function setupDarkHeader() {
  const opening = document.querySelector<HTMLElement>('.opening[data-tone="dark"]');
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!opening || !header) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    root.style.setProperty('--header-h', `${header.offsetHeight}px`);
    const over = opening.getBoundingClientRect().bottom > header.offsetHeight;
    root.dataset.header = over ? 'dark' : 'light';
  };
  const schedule = () => (frame ||= requestAnimationFrame(update));
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();
}
setupDarkHeader();
