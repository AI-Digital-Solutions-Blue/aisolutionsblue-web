// Adscena demo loop: the web address is typed and read, then the product's own screens follow one
// another like app navigation (each new screen pushed in from the right), with a finger's tap on
// the buttons. The steps beside the phone light up and fill as the loop goes.
import { gsap } from 'gsap';

const demo = document.querySelector<HTMLElement>('[data-ad-demo]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setup() {
  if (!demo) return;
  const screens = [...demo.querySelectorAll<HTMLElement>('[data-ad-s]')];
  const steps = [...demo.querySelectorAll<HTMLElement>('[data-ad-step]')];
  const bars = [...demo.querySelectorAll<HTMLElement>('[data-ad-step-bar]')];
  const typed = demo.querySelector<HTMLElement>('[data-ad-typed]')!;
  const cta = demo.querySelector<HTMLElement>('[data-ad-cta]')!;
  const checks = [...demo.querySelectorAll<HTMLElement>('[data-ad-check]')];
  const progress = demo.querySelector<HTMLElement>('[data-ad-progress]')!;
  const tap = demo.querySelector<HTMLElement>('[data-ad-tap]')!;
  const screenBox = demo.querySelector<HTMLElement>('.ad-screen')!;
  const url = 'www.estudioalma.es';

  // When each screen comes on, and which step it belongs to.
  const at = [0, 2.4, 4, 5.2, 7, 8.4, 9.6, 11.4];
  const stepOf = [0, 0, 1, 1, 2, 2, 3, 4];
  const END = 13.6;

  const activate = (n: number) =>
    steps.forEach((step, i) => step.classList.toggle('is-on', i === n));

  if (reduceMotion.matches) {
    // A still frame: the ad to choose, under its step.
    gsap.set(screens[3], { visibility: 'visible' });
    activate(1);
    return;
  }

  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: 'expo.out' } });

  // A tap at a point of the screen, given in % of its width and height.
  const touch = (time: number, x: number, y: number) =>
    tl
      .set(tap, { left: `${x}%`, top: `${y}%` }, time)
      .fromTo(tap, { scale: 0.4, opacity: 0.9 }, { scale: 1.1, opacity: 0, duration: 0.55 }, time);

  // Start of every loop: first screen only, nothing done yet.
  tl.set(screens, { visibility: 'hidden', xPercent: 0, yPercent: 0, opacity: 1 }, 0)
    .set(screens[0], { visibility: 'visible' }, 0)
    .call(
      () => {
        checks.forEach((check) => check.classList.remove('is-done'));
        typed.textContent = '';
      },
      [],
      0,
    )
    .set([progress, ...bars], { scaleX: 0 }, 0);

  // Steps light up with their screens and fill while they last.
  const stepStarts = [0, 4, 7, 9.6, 11.4, END];
  stepStarts.slice(0, -1).forEach((start, n) => {
    tl.call(() => activate(n), [], start + 0.01).fromTo(
      bars[n],
      { scaleX: 0 },
      { scaleX: 1, duration: stepStarts[n + 1] - start, ease: 'none' },
      start,
    );
  });

  // 1. The address is typed, then «Continuar».
  const typing = { n: 0 };
  tl.fromTo(
    typing,
    { n: 0 },
    {
      n: url.length,
      duration: 1.3,
      ease: 'none',
      onUpdate: () => (typed.textContent = url.slice(0, Math.round(typing.n))),
    },
    0.5,
  );
  tl.call(
    () => {
      const s = screenBox.getBoundingClientRect();
      const b = cta.getBoundingClientRect();
      gsap.set(tap, {
        left: `${((b.left + b.width / 2 - s.left) / s.width) * 100}%`,
        top: `${((b.top + b.height / 2 - s.top) / s.height) * 100}%`,
      });
    },
    [],
    1.95,
  )
    .fromTo(tap, { scale: 0.4, opacity: 0.9 }, { scale: 1.1, opacity: 0, duration: 0.55 }, 2)
    .to(cta, { scale: 0.96, duration: 0.1, ease: 'power2.in' }, 2)
    .to(cta, { scale: 1, duration: 0.3 }, 2.1);

  // Screens are pushed in from the right, like app navigation.
  at.forEach((time, i) => {
    if (!i) return;
    tl.set(screens[i], { visibility: 'visible' }, time)
      .fromTo(
        screens[i],
        { xPercent: 100 },
        { xPercent: 0, duration: 0.6, ease: 'expo.inOut' },
        time,
      )
      .to(screens[i - 1], { xPercent: -28, opacity: 0.6, duration: 0.6, ease: 'expo.inOut' }, time)
      .set(screens[i - 1], { visibility: 'hidden' }, time + 0.6);
  });

  // 2. The web is read: the three checks tick and the bar fills.
  checks.forEach((check, n) => tl.call(() => check.classList.add('is-done'), [], 2.95 + n * 0.32));
  tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power1.inOut' }, 2.8);

  // Taps on the buttons of the product's own screens.
  touch(6.75, 50, 92.6); // «Seguir con esta»
  touch(8.1, 50, 93); // «Conectar con Facebook»

  // The audience screen is taller: it scrolls to its button.
  tl.to(screens[6], { yPercent: -9, duration: 0.9, ease: 'power2.inOut' }, 10.3);

  // Back to the start, softly.
  tl.set(screens[0], { visibility: 'visible', xPercent: 0, opacity: 1 }, END - 0.5)
    .to(screens[7], { opacity: 0, duration: 0.5, ease: 'power2.in' }, END - 0.5)
    .set({}, {}, END);

  tl.seek(0.01);
  // Development only: lets the browser inspector seek the loop.
  if (import.meta.env.DEV) (window as unknown as { __adDemo: gsap.core.Timeline }).__adDemo = tl;
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? tl.play() : tl.pause())).observe(
    demo,
  );
}

setup();
