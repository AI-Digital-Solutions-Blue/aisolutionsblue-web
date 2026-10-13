// The feel of the site: inertial scrolling, the brand ring as a cursor companion and magnetic
// calls to action. Desktop with a fine pointer only, and never with reduced motion; the page
// works exactly the same without any of it.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

declare global {
  interface Window {
    /** Scrolls to a position or element, through the inertial scroll when it is active. */
    blueScrollTo?: (target: number | HTMLElement) => void;
  }
}

/* ---------- Inertial scroll, kept in step with ScrollTrigger (mouse and trackpad only) ---------- */
if (!calm && finePointer) {
  const header = document.querySelector<HTMLElement>('.site-header');
  const lenis = new Lenis({
    lerp: 0.1,
    anchors: { offset: -((header?.offsetHeight ?? 80) + 12) },
  });
  lenis.on('scroll', ScrollTrigger.update);
  // Elements land below the sticky header; plain positions are used as given.
  window.blueScrollTo = (target) =>
    lenis.scrollTo(target, {
      offset: typeof target === 'number' ? 0 : -((header?.offsetHeight ?? 80) + 12),
    });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- The ring follows the pointer and answers what it can act on ---------- */
if (!calm && finePointer) {
  const ring = document.createElement('span');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);
  const toX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
  const toY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
  addEventListener(
    'pointermove',
    (event) => {
      ring.classList.add('is-visible');
      toX(event.clientX);
      toY(event.clientY);
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => ring.classList.remove('is-visible'));
  const actionable = 'a, button, summary, select, input, textarea, label, [data-stage-tab]';
  document.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element ? event.target.closest(actionable) : null;
    ring.classList.toggle('is-active', Boolean(target));
    ring.classList.toggle('is-dark', Boolean(target?.closest('.closing, .stage, .pp-cta')));
  });

  /* Magnetic calls to action: they lean toward the pointer and spring back. */
  document.querySelectorAll<HTMLElement>('.button, .nav-contact').forEach((button) => {
    const mx = gsap.quickTo(button, 'x', { duration: 0.4, ease: 'power3.out' });
    const my = gsap.quickTo(button, 'y', { duration: 0.4, ease: 'power3.out' });
    button.addEventListener('pointermove', (event) => {
      const r = button.getBoundingClientRect();
      mx((event.clientX - (r.left + r.width / 2)) * 0.25);
      my((event.clientY - (r.top + r.height / 2)) * 0.35);
    });
    button.addEventListener('pointerleave', () => {
      gsap.to(button, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    });
  });

  /* Depth: tilting elements lean toward the pointer, as if held in the hand. */
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const area = el.closest('section') ?? el;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    area.addEventListener('pointermove', (event) => {
      const r = el.getBoundingClientRect();
      const px = (event.clientX - (r.left + r.width / 2)) / innerWidth;
      const py = (event.clientY - (r.top + r.height / 2)) / innerHeight;
      ry(gsap.utils.clamp(-7, 7, px * 14));
      rx(gsap.utils.clamp(-6, 6, -py * 12));
    });
    area.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}

export {};
