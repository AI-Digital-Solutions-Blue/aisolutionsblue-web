// Reel choreography: one looping GSAP timeline of twenty-one seconds. The ring of the logo and the four
// verbs of the process, a wall of real work carrying the two messages, four wishes of an owner
// (more bookings, everything in one place, no paperwork, new customers) on one stage, each
// answered by a real product as a floating 3D card, three outcomes side by side, and the Blue logo: its dot beats and lands in place while the letters appear. Positions
// live in CSS container units, so nothing is measured and the timeline only needs rebuilding when
// the frame changes orientation.
import { gsap } from 'gsap';

const reel = document.querySelector<HTMLElement>('[data-reel]');
const frame = reel?.querySelector<HTMLElement>('.reel-frame');
const toggle = reel?.querySelector<HTMLButtonElement>('[data-r-toggle]');
const header = document.querySelector<HTMLElement>('.site-header');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

// How far the logo's dot sits from the centre of the logo, in dot sizes (from .r-dot in CSS):
// the dot starts large in the middle of the frame and travels to its place in the wordmark.
// The dot is 70 px square at (0, 194) in the 1016×472 logo image.
const DOT = { left: 0, top: 194, size: 70, w: 1016, h: 472 };
const DOT_FROM_CENTER = {
  x: (DOT.w / 2 - DOT.left - DOT.size / 2) / DOT.size,
  y: (DOT.h / 2 - DOT.top - DOT.size / 2) / DOT.size,
};

function setup() {
  if (!reel || !frame) return;
  const box: HTMLElement = frame;
  const $ = <T extends Element = HTMLElement>(selector: string, scope: Element = box) =>
    scope.querySelector<T>(selector)!;
  const $$ = <T extends Element = HTMLElement>(selector: string, scope: Element = box) => [
    ...scope.querySelectorAll<T>(selector),
  ];
  const scene = (name: string) => $(`[data-r="${name}"]`);
  const bar = $('[data-r-progress]');
  // Everything the timeline touches, and nothing else: GSAP folds a CSS `translate` into the inline
  // transform of any element it handles, which would undo the layout of the static wrappers.
  const animated = () =>
    $$(
      '.r-scene, [data-r-anim], [data-r-mark], [data-r-line], [data-r-word], [data-r-plane], [data-r-row], [data-r-title], [data-r-tri-col], [data-r-tri-word], [data-r-logo-img], [data-r-dot], [data-r-progress]',
    );

  let timeline: gsap.core.Timeline | null = null;
  let holding = false;
  let wallReady = false;
  const wallImages = $$<HTMLImageElement>('[data-r="wall"] img');
  Promise.race([
    Promise.all(
      wallImages.map((img) =>
        img.complete
          ? null
          : new Promise((done) => {
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            }),
      ),
    ),
    new Promise((done) => setTimeout(done, 4000)),
  ]).then(() => {
    wallReady = true;
    if (holding) {
      holding = false;
      sync();
    }
  });
  let portrait = false;
  let userPaused = false;
  let visible = false;

  function reset() {
    timeline?.kill();
    timeline = null;
    gsap.set(animated(), {
      clearProps:
        'transform,translate,rotate,scale,opacity,visibility,clipPath,filter,xPercent,yPercent,left,top,--ax,--ay,--bx,--by',
    });
    delete reel!.dataset.static;
  }

  function build() {
    reset();
    portrait = box.clientWidth < box.clientHeight;
    const tl = gsap.timeline({
      repeat: -1,
      paused: true,
      defaults: { ease: 'expo.out' },
      onUpdate: () => gsap.set(bar, { scaleX: tl.progress() }),
    });
    const show = (el: HTMLElement, at: number) => tl.set(el, { visibility: 'visible' }, at);
    const hide = (el: HTMLElement, at: number) => tl.set(el, { visibility: 'hidden' }, at);

    /* 1. Process: the ring, a line, and what we do (0 – 2.1 s) */
    const open = scene('open');
    const mark = $('[data-r-mark]', open);
    const line = $('[data-r-line]', open);
    const words = $$('[data-r-word]', open);
    show(open, 0);
    tl.fromTo(mark, { scale: 0 }, { scale: 1, duration: 0.7, ease: 'back.out(2.2)' }, 0.05).fromTo(
      line,
      portrait ? { scaleY: 0 } : { scaleX: 0 },
      { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'expo.inOut' },
      0.3,
    );
    words.forEach((word, i) => {
      const at = 0.6 + i * 0.36;
      tl.fromTo(
        word,
        { opacity: 0, yPercent: 30 },
        { opacity: 1, yPercent: 0, duration: 0.25 },
        at,
      );
      if (i < words.length - 1) tl.set(word, { opacity: 0 }, at + 0.36);
    });

    /* 2. The wall: it opens out of the ring like a portal (2.1 – 7.4 s) */
    const wall = scene('wall');
    const plane = $('[data-r-plane]', wall);
    const rows = $$('[data-r-row]', wall);
    const titles = $$('[data-r-title]', wall);
    const center = portrait ? '50% 34%' : '22% 50%';
    show(wall, 2.1);
    tl.fromTo(
      wall,
      { clipPath: `circle(0% at ${center})` },
      { clipPath: `circle(150% at ${center})`, duration: 1, ease: 'expo.inOut' },
      2.1,
    )
      .to(mark, { scale: 6, opacity: 0, duration: 0.9, ease: 'expo.in' }, 2.0)
      .fromTo(
        plane,
        { scale: portrait ? 1 : 0.8 },
        { scale: portrait ? 1.3 : 1.12, duration: 5.3, ease: 'none' },
        2.1,
      );
    rows.forEach((row, i) =>
      tl.fromTo(
        row,
        { xPercent: i % 2 ? -10 : 2 },
        { xPercent: i % 2 ? 2 : -12, duration: 5.3, ease: 'none' },
        2.1,
      ),
    );
    hide(open, 3.1);
    titles.forEach((title, i) => {
      const at = 2.9 + i * 1.9;
      tl.fromTo(
        title,
        { opacity: 0, scale: 0.92, filter: 'blur(8px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6 },
        at,
      ).to(title, { opacity: 0, filter: 'blur(6px)', duration: 0.3, ease: 'power2.in' }, at + 1.5);
    });

    /* 3. What an owner wants: one stage, four wishes (6.6 – 15.6 s). The wish rises letter by
       letter on the left; the product arrives as a 3D card on the right, catches the light, and
       shows its own small motion. Between wishes the card turns away in depth as the next one
       swings in, the letters fall out and the light moves. */
    const build = scene('build');
    const aura = $('[data-r-aura]', build);
    const says = $$('[data-r-say]', build);
    const cards = $$('[data-r-card]', build);
    const SHOT = 2.25;
    const shotAt = (i: number) => 6.6 + i * SHOT;
    // Where the two pools of light sit for each wish.
    const light = [
      { '--ax': '72%', '--ay': '35%', '--bx': '28%', '--by': '78%' },
      { '--ax': '30%', '--ay': '30%', '--bx': '75%', '--by': '70%' },
      { '--ax': '60%', '--ay': '70%', '--bx': '20%', '--by': '25%' },
      { '--ax': '80%', '--ay': '55%', '--bx': '40%', '--by': '20%' },
    ];
    tl.to(plane, { scale: 3, opacity: 0, duration: 0.9, ease: 'expo.in' }, 6.2);
    show(build, 6.6);
    tl.fromTo(
      build,
      { clipPath: 'inset(32% 30% 32% 30% round 3cqmin)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0cqmin)', duration: 0.9, ease: 'expo.inOut' },
      6.6,
    ).fromTo(aura, light[0], { ...light[0], duration: 0.1 }, 6.6);
    hide(wall, 7.5);

    says.forEach((say, i) => {
      const at = shotAt(i);
      const next = i < says.length - 1 ? shotAt(i + 1) : 15.6;
      const chars = $$('[data-r-ch]', say);
      const kind = $('[data-r-kind]', say);
      const small = $('[data-r-small]', say);
      const card = cards[i];
      const shine = $('[data-r-shine]', card);
      const chips = $$('[data-r-chip]', card);
      const flies = $$('[data-r-fly]', card);
      const scan = card.querySelector<HTMLElement>('[data-r-scan]');
      const video = card.querySelector<HTMLVideoElement>('[data-r-shot-video]');
      const enter = i === 0 ? at + 0.35 : at + 0.2;

      // The light drifts to its place for this wish.
      if (i > 0) tl.to(aura, { ...light[i], duration: 1.4, ease: 'power2.inOut' }, at - 0.2);

      // Words: the kind of work, the wish letter by letter, then the plain line.
      tl.fromTo(
        chars,
        { yPercent: 115, rotate: 8 },
        { yPercent: 0, rotate: 0, duration: 0.75, stagger: 0.022, ease: 'expo.out' },
        enter,
      )
        .fromTo(kind, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, enter - 0.05)
        .fromTo(small, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, enter + 0.4)
        .to(
          chars,
          { yPercent: -115, duration: 0.35, stagger: 0.01, ease: 'power3.in' },
          next - 0.35,
        )
        .to([kind, small], { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, next - 0.35);

      // The card swings in from depth, then turns slowly while it is on.
      show(card, at);
      tl.fromTo(
        card,
        { rotateY: 38, rotateX: 8, xPercent: 22, z: -260, opacity: 0, filter: 'blur(10px)' },
        {
          rotateY: 10,
          rotateX: 4,
          xPercent: 0,
          z: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'expo.out',
        },
        enter - 0.1,
      )
        .to(
          card,
          { rotateY: -8, rotateX: -2, duration: next - enter - 0.4, ease: 'none' },
          enter + 0.9,
        )
        .to(
          card,
          {
            rotateY: -40,
            xPercent: -28,
            z: -320,
            opacity: 0,
            filter: 'blur(10px)',
            duration: 0.55,
            ease: 'expo.in',
          },
          next - 0.4,
        );
      hide(card, next + 0.2);

      // Light catches the glass.
      tl.fromTo(
        shine,
        { xPercent: -150 },
        { xPercent: 380, duration: 1.1, ease: 'power2.inOut' },
        enter + 0.5,
      );

      // Live states pop in around the card.
      chips.forEach((chip, n) =>
        tl.fromTo(
          chip,
          { opacity: 0, scale: 0.6, y: 20, z: 90 },
          { opacity: 1, scale: 1, y: 0, z: 90, duration: 0.6, ease: 'back.out(2)' },
          enter + (scan ? 1.15 : 0.7) + n * 0.3,
        ),
      );

      // Software: the parts of the business fly in from around and land in the one panel.
      // In the tall frame the card spans the width, so they come from above and below instead.
      const from = portrait
        ? [
            ['18%', '-22%'],
            ['82%', '-22%'],
            ['18%', '122%'],
            ['82%', '122%'],
          ]
        : [
            ['-4%', '-12%'],
            ['104%', '-10%'],
            ['-6%', '110%'],
            ['106%', '108%'],
          ];
      flies.forEach((fly, n) =>
        tl
          .fromTo(
            fly,
            {
              left: from[n][0],
              top: from[n][1],
              xPercent: -50,
              yPercent: -50,
              opacity: 0,
              scale: 1,
              z: 120,
            },
            { opacity: 1, duration: 0.25, ease: 'power1.out' },
            enter + 0.45 + n * 0.12,
          )
          .to(
            fly,
            { left: '50%', top: '50%', scale: 0.4, opacity: 0, duration: 0.8, ease: 'expo.in' },
            enter + 0.75 + n * 0.12,
          ),
      );

      // Automation: a scanner reads the ticket.
      if (scan)
        tl.fromTo(
          scan,
          { top: '-18%', opacity: 1 },
          { top: '100%', duration: 0.9, ease: 'power1.inOut' },
          enter + 0.4,
        ).to(scan, { opacity: 0, duration: 0.2 }, enter + 1.3);

      // The phone loop starts from its first frame each time it comes on.
      if (video)
        tl.call(
          () => {
            video.currentTime = 0;
            video.play().catch(() => {});
          },
          [],
          at,
        );
    });

    /* 4. The three of it side by side, out of focus, with their words (15.6 – 16.9 s) */
    const tri = scene('tri');
    const cols = $$('[data-r-tri-col]', tri);
    const triWords = $$('[data-r-tri-word]', tri);
    show(tri, 15.6);
    tl.fromTo(tri, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 15.6)
      .fromTo(
        cols,
        portrait ? { xPercent: 110 } : { yPercent: 110 },
        { xPercent: 0, yPercent: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' },
        15.6,
      )
      .fromTo(
        triWords,
        { opacity: 0, filter: 'blur(10px)', scale: 0.94 },
        { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.6, stagger: 0.1 },
        15.9,
      );
    hide(build, 15.9);

    /* 5. The logo: the dot appears once, travels to its place, the letters appear, and the logo
       holds before the loop starts again (16.8 – 21 s) */
    const L = 16.8;
    const logo = scene('logo');
    const dot = $('[data-r-dot]', logo);
    const letters = $('[data-r-logo-img]', logo);
    show(logo, L);
    tl.fromTo(
      logo,
      { clipPath: 'circle(0% at 50% 50%)' },
      { clipPath: 'circle(80% at 50% 50%)', duration: 0.8, ease: 'expo.inOut' },
      L,
    )
      // The letters stay hidden left of the dot: the travelling dot is the logo's dot.
      .set(letters, { clipPath: 'inset(0% 100% 0% 7%)' }, L)
      .fromTo(
        dot,
        { xPercent: DOT_FROM_CENTER.x * 100, yPercent: DOT_FROM_CENTER.y * 100, scale: 0 },
        { scale: 3, duration: 0.7, ease: 'expo.out' },
        L + 0.25,
      )
      // It grows once, then takes its place in the wordmark.
      .to(dot, { xPercent: 0, yPercent: 0, scale: 1, duration: 0.85, ease: 'expo.inOut' }, L + 1.05)
      .to(letters, { clipPath: 'inset(0% 0% 0% 7%)', duration: 1, ease: 'expo.out' }, L + 1.45)
      // The finished logo holds for a while before the reel starts over.
      .to(logo, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 20.65);
    hide(tri, L + 0.9);
    hide(logo, 21);

    // Online, the wall's photos may still be arriving when the ring opens onto it: the reel holds
    // on the ring until they are in (at most a few seconds), so the wall never shows empty tiles.
    tl.call(
      () => {
        if (wallReady) return;
        holding = true;
        tl.pause();
      },
      [],
      2.0,
    );

    timeline = tl;
    sync();
  }

  function still() {
    // Reduced motion: the logo, composed and still.
    reset();
    reel!.dataset.static = '';
    gsap.set(scene('logo'), { visibility: 'visible' });
    gsap.set($('[data-r-logo-img]'), { clipPath: 'inset(0% 0% 0% 7%)' });
  }

  function sync() {
    if (!timeline) return;
    const play = visible && !userPaused && !document.hidden && !holding;
    if (play) timeline.play();
    else timeline.pause();
    // Videos inside the reel follow its pause.
    $$<HTMLVideoElement>('video').forEach((video) =>
      play ? video.play().catch(() => {}) : video.pause(),
    );
  }

  // The frame fills the first screen below the header.
  const measureHeader = () =>
    root.style.setProperty('--header-h', `${header?.offsetHeight ?? 86}px`);
  measureHeader();
  addEventListener('resize', measureHeader);

  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(box);
  new ResizeObserver(() => {
    if (reduceMotion.matches || !timeline) return;
    if (box.clientWidth < box.clientHeight !== portrait) build();
  }).observe(box);
  reduceMotion.addEventListener('change', () => (reduceMotion.matches ? still() : build()));

  // Development only: lets the browser inspector seek the reel.
  if (import.meta.env.DEV)
    (window as unknown as { __reel: () => typeof timeline }).__reel = () => timeline;

  // Decode every image ahead of its shot, so no scene opens on a blank frame.
  $$<HTMLImageElement>('img').forEach((img) => img.decode?.().catch(() => {}));

  document.fonts.ready.then(() => (reduceMotion.matches ? still() : build()));
}

setup();
