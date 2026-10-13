// Products carousel: the track scrolls natively (swipe, trackpad, snap points); this adds a mouse
// drag, the arrows and dots, the cards' entrance and their depth as they pass the focus point.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector<HTMLElement>('[data-showcase]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setup() {
  if (!section) return;
  const head = section.querySelector<HTMLElement>('[data-sc-head]')!;
  const track = section.querySelector<HTMLElement>('[data-sc-track]')!;
  const cards = [...section.querySelectorAll<HTMLElement>('[data-sc-card]')];
  const links = cards.map((card) => card.querySelector<HTMLElement>('.sc-link')!);
  // Screens drift inside their frame; a phone card has none (its iPhone stays whole).
  const media = cards.map((card) => card.querySelector<HTMLElement>('[data-sc-media]'));
  const dots = [...section.querySelectorAll<HTMLElement>('[data-sc-dot]')];
  const prev = section.querySelector<HTMLButtonElement>('[data-sc-prev]');
  const next = section.querySelector<HTMLButtonElement>('[data-sc-next]');
  if (!cards.length) return;

  // The track starts where the page's content starts, and runs to the window's edge.
  let pad = 0;
  const measure = () => {
    pad = head.getBoundingClientRect().left;
    section.style.setProperty('--sc-pad', `${Math.max(16, pad)}px`);
  };
  const step = () => cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');

  // Depth: the card at the focus point faces you; the others turn slightly and step back.
  let frame = 0;
  const render = () => {
    frame = 0;
    const width = cards[0].offsetWidth;
    const focus = track.getBoundingClientRect().left + Math.max(16, pad) + width / 2;
    let active = 0;
    let best = Infinity;
    cards.forEach((card, i) => {
      const box = card.getBoundingClientRect();
      const d = (box.left + box.width / 2 - focus) / width;
      if (Math.abs(d) < best) {
        best = Math.abs(d);
        active = i;
      }
      if (reduceMotion.matches) return;
      const k = gsap.utils.clamp(-1.5, 1.5, d);
      gsap.set(links[i], { rotateY: k * -9, scale: 1 - Math.abs(k) * 0.05, z: 0 });
      const screen = media[i];
      if (screen) gsap.set(screen, { xPercent: k * -6 });
    });
    dots.forEach((dot, i) => dot.classList.toggle('is-on', i === active));
    if (prev) prev.disabled = track.scrollLeft < 4;
    if (next) next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4;
  };
  const schedule = () => (frame ||= requestAnimationFrame(render));
  track.addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => {
    measure();
    schedule();
  });
  measure();
  render();

  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

  // Mouse drag; touch and trackpads already scroll the track natively. The drag only starts
  // once the mouse has moved: a plain click must reach the card's link.
  let startX = 0;
  let startScroll = 0;
  let pressed = false;
  let moved = false;
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    startX = event.clientX;
    startScroll = track.scrollLeft;
    pressed = true;
    moved = false;
  });
  track.addEventListener('pointermove', (event) => {
    if (!pressed) return;
    const dx = event.clientX - startX;
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }
    if (moved) track.scrollLeft = startScroll - dx;
  });
  const release = () => {
    pressed = false;
    if (!track.classList.contains('is-dragging')) return;
    track.classList.remove('is-dragging');
    // Settle on the nearest card.
    const target = Math.round(track.scrollLeft / step()) * step();
    track.scrollTo({ left: target, behavior: 'smooth' });
  };
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', release);
  // A drag is not a click on the card under the pointer.
  track.addEventListener(
    'click',
    (event) => {
      if (moved) {
        event.preventDefault();
        moved = false;
      }
    },
    true,
  );

  // Entrance: the cards arrive from the right in depth, one after another.
  if (!reduceMotion.matches)
    gsap.from(cards, {
      x: () => innerWidth * 0.35,
      rotateY: -18,
      opacity: 0,
      duration: 1.2,
      stagger: 0.09,
      ease: 'expo.out',
      scrollTrigger: { trigger: track, start: 'top 85%', once: true },
      onComplete: schedule,
    });
}

setup();
