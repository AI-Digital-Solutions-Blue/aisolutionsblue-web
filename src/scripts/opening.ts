// Opening choreography. Content is complete in the HTML; this script only adds motion on top.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Field, sampleShape } from './field';
import { stageShapes } from './shapes';

gsap.registerPlugin(ScrollTrigger);
// Mobile address-bar resizes must not re-measure the pinned stage mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true });
// Development only: lets the browser inspector drive the timelines frame by frame.
if (import.meta.env.DEV) (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;

const root = document.documentElement;
const stage = document.querySelector<HTMLElement>('[data-stage]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- Stage: pinned for three short chapters; the field traces each one's form ---------- */

function setupStage() {
  if (!stage) return;
  const chapters = [...stage.querySelectorAll<HTMLElement>('[data-stage-chapter]')];
  const tabs = [...stage.querySelectorAll<HTMLButtonElement>('[data-stage-tab]')];
  const area = stage.querySelector<HTMLElement>('[data-stage-form]');
  const canvas = stage.querySelector<HTMLCanvasElement>('[data-field="stage"]');
  if (!chapters.length || !tabs.length) return;
  const steps = tabs.length;
  let current = 0;
  let morph: gsap.core.Tween | null = null;
  let trigger: ScrollTrigger | null = null;

  // A quiet cloud behind the panel; the particles that form trace fine outlines beside the title.
  const field = canvas
    ? Field.create(canvas, {
        theme: 'dark',
        density: 9000,
        formable: 0.45,
        scale: 0.85,
        formGlow: 0.22,
        ambient: 0.4,
        size: 0.78,
        jitter: 0.45,
      })
    : null;
  let shapes: Float32Array[] = [];
  let center = { x: 0, y: 0 };
  function measureShapes() {
    if (!field || !area || !canvas) return;
    const box = area.getBoundingClientRect();
    const base = canvas.getBoundingClientRect();
    const w = box.width * 0.86;
    const h = box.height * 0.8;
    const x = box.left - base.left + (box.width - w) / 2;
    const y = box.top - base.top + (box.height - h) / 2;
    center = { x: x + w / 2, y: y + h / 2 };
    shapes = stageShapes.map((draw) => {
      const points = sampleShape(draw, w, h, field.formableCount);
      for (let i = 0; i < points.length; i += 2) {
        points[i] += x;
        points[i + 1] += y;
      }
      return points;
    });
    morph?.progress(1);
    field.setTarget(0, shapes[current]);
    field.state.mix = 0;
  }

  if (field && canvas) {
    canvas.addEventListener('fieldresize', measureShapes);
    measureShapes();
    stage.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || reduceMotion.matches) return;
      const bounds = canvas.getBoundingClientRect();
      field.pointerAt(event.clientX - bounds.left, event.clientY - bounds.top);
    });
    stage.addEventListener('pointerleave', () => field.pointerLeave());

    if (reduceMotion.matches) {
      field.state.form = 1;
      field.still(true);
    } else {
      // The first form gathers out of the cloud as the panel comes into view.
      ScrollTrigger.create({
        trigger: stage,
        start: 'top 70%',
        once: true,
        onEnter: () => play(current),
      });
      // A slow, soft heartbeat from the formed shape while the panel is on screen.
      const beat = () => {
        field.pulse(center.x, center.y, 0.45);
        gsap.delayedCall(0.28, () => field.pulse(center.x, center.y, 0.28));
        gsap.delayedCall(3.6 + Math.random(), beat);
      };
      gsap.delayedCall(3, beat);
    }
  }

  // Each chapter tells one turn: the problem appears, a line strikes it out, and the solution
  // takes its place while the scattered cloud gathers into the product's form (chaos to order).
  const part = (chapter: HTMLElement, name: string) =>
    chapter.querySelector<HTMLElement>(`[data-stage-${name}]`)!;
  let turn: gsap.core.Timeline | null = null;
  gsap.set(chapters.slice(1), { autoAlpha: 0 });

  function settle(chapter: HTMLElement) {
    // The finished state: only the solution and its product, as without motion.
    gsap.set(part(chapter, 'pain'), { autoAlpha: 0 });
    gsap.set([part(chapter, 'outcome'), part(chapter, 'who')], {
      autoAlpha: 1,
      y: 0,
      filter: 'none',
    });
  }

  function play(i: number) {
    const chapter = chapters[i];
    const pain = part(chapter, 'pain');
    const strike = part(chapter, 'strike');
    const outcome = part(chapter, 'outcome');
    const who = part(chapter, 'who');
    turn?.kill();
    turn = gsap
      .timeline({ defaults: { ease: 'expo.out' } })
      .set(chapter, { autoAlpha: 1, y: 0, filter: 'none' })
      .set(outcome, { autoAlpha: 0 })
      .set(who, { autoAlpha: 0, y: 10 })
      .set(strike, { '--strike': '0%' })
      .fromTo(pain, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0)
      .to(strike, { '--strike': '100%', duration: 0.45, ease: 'power2.inOut' }, 0.6)
      .to(
        pain,
        { autoAlpha: 0, y: -14, filter: 'blur(8px)', duration: 0.35, ease: 'power2.in' },
        1.15,
      )
      .fromTo(
        outcome,
        { autoAlpha: 0, y: 28, filter: 'blur(10px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8 },
        1.3,
      )
      .to(who, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.55);
    if (field) {
      // The cloud scatters while the problem is on screen and gathers with the solution.
      gsap.killTweensOf(field.state, 'form');
      gsap.to(field.state, { form: 0.12, duration: 0.6, ease: 'power2.out' });
      gsap.to(field.state, { form: 1, duration: 1.4, delay: 1.1, ease: 'expo.inOut' });
      gsap.delayedCall(1.9, () => field.pulse(center.x, center.y, 0.7));
    }
  }

  function show(i: number, animate: boolean) {
    chapters.forEach((chapter, n) => {
      const on = n === i;
      chapter.toggleAttribute('aria-hidden', !on);
      part(chapter, 'who').setAttribute('tabindex', on ? '0' : '-1');
      gsap.killTweensOf(chapter);
      if (!animate) {
        gsap.set(chapter, { autoAlpha: on ? 1 : 0, y: 0, filter: 'none' });
        if (on) settle(chapter);
        return;
      }
      if (on) play(n);
      else
        gsap.to(chapter, {
          autoAlpha: 0,
          y: -16,
          filter: 'blur(6px)',
          duration: 0.35,
          ease: 'power2.in',
        });
    });
  }
  // Without motion, every chapter is its solution.
  if (reduceMotion.matches) chapters.forEach(settle);

  // The cloud lets go of one form and gathers into the next, with a soft wave of light through it.
  function reshape(i: number, animate: boolean) {
    if (!field || !shapes[i]) return;
    morph?.progress(1);
    if (!animate) {
      field.setTarget(0, shapes[i]);
      field.state.mix = 0;
      return;
    }
    field.setTarget(1, shapes[i]);
    field.state.mix = 0;
    morph = gsap.to(field.state, {
      mix: 1,
      duration: 1.1,
      ease: 'expo.inOut',
      onComplete: () => {
        field.setTarget(0, shapes[i]);
        field.state.mix = 0;
      },
    });
    gsap.delayedCall(0.5, () => field.pulse(center.x, center.y, 0.6));
  }

  function select(i: number, animate: boolean) {
    if (i === current) return;
    tabs.forEach((tab, n) => tab.setAttribute('aria-pressed', String(n === i)));
    current = i;
    reshape(i, animate);
    show(i, animate);
  }

  // With a pinned stage the tabs jump to their stretch of scroll; otherwise they swap directly.
  tabs.forEach((tab, i) =>
    tab.addEventListener('click', () => {
      if (!trigger) return select(i, !reduceMotion.matches);
      const span = trigger.end - trigger.start;
      const top = trigger.start + (span * i) / (steps - 1);
      if (window.blueScrollTo) window.blueScrollTo(top);
      else scrollTo({ top, behavior: 'smooth' });
    }),
  );

  const header = document.querySelector<HTMLElement>('.site-header');
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const headerHeight = () => header?.offsetHeight ?? 0;
    // Pin only when the whole stage fits below the header; tall stages keep normal scrolling.
    // Re-checked on resize: a page opened in a background tab can report a zero-height window.
    const fits = () => innerHeight > 0 && stage.offsetHeight <= innerHeight - headerHeight() - 24;
    const pin = () => {
      stage.dataset.scroll = '';
      trigger = ScrollTrigger.create({
        trigger: stage,
        start: () =>
          `top ${headerHeight() + (innerHeight - headerHeight() - stage.offsetHeight) / 2}`,
        // About half a screen of scroll between chapters: short enough to move on.
        end: () => `+=${innerHeight * 0.6 * (steps - 1)}`,
        pin: true,
        invalidateOnRefresh: true,
        onRefresh: measureShapes,
        // The scroll comes to rest on a chapter, never between two.
        snap: {
          snapTo: 1 / (steps - 1),
          duration: { min: 0.3, max: 0.7 },
          delay: 0.08,
          ease: 'power2.inOut',
          // Nearest chapter, not the next one: entering the pin must not skip the first.
          directional: false,
        },
        onUpdate: (self) => {
          const p = self.progress * (steps - 1);
          tabs.forEach((tab, n) =>
            tab.style.setProperty('--progress', String(gsap.utils.clamp(0, 1, p - n + 1))),
          );
          select(Math.round(p), true);
        },
      });
    };
    const unpin = () => {
      trigger?.kill(true);
      trigger = null;
      delete stage.dataset.scroll;
      tabs.forEach((tab) => tab.style.removeProperty('--progress'));
    };
    const sync = () => {
      const had = Boolean(trigger);
      if (fits() && !trigger) pin();
      else if (!fits() && trigger) unpin();
      // Pinning adds scroll space: every trigger further down must recalculate its positions.
      if (had !== Boolean(trigger)) ScrollTrigger.refresh();
    };
    sync();
    const onResize = () => gsap.delayedCall(0.2, sync);
    addEventListener('resize', onResize);
    return () => {
      removeEventListener('resize', onResize);
      unpin();
    };
  });
}

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

setupStage();
// The pinned stage adds scroll space after load; re-aim links like /#soluciones at their target.
const target = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
if (target)
  requestAnimationFrame(() =>
    window.blueScrollTo ? window.blueScrollTo(target) : target.scrollIntoView(),
  );
