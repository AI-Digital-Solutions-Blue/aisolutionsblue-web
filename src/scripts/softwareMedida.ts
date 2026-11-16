// Motion of /software-a-medida (the home page's script handles line reveals, the process line and
// the dashboard and automation scenes). Everything here has a readable static state without it.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const mm = gsap.matchMedia();
const MOTION = '(prefers-reduced-motion: no-preference)';

/** Plays a looping timeline only while its element is on screen. */
const loopWhileVisible = (el: Element, tl: gsap.core.Timeline) => {
  tl.pause();
  ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    end: 'bottom 10%',
    onToggle: (self) => (self.isActive ? tl.resume() : tl.pause()),
  });
};

/** Offset of an element inside an ancestor, ignoring transforms. */
const offsetIn = (el: HTMLElement, ancestor: HTMLElement) => {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
};

/* ---------- 1. Stage ---------- */
mm.add(MOTION, () => {
  // The headline rises line by line; the rest follows.
  const title = document.querySelector<HTMLElement>('[data-hero-title]');
  document.fonts.ready.then(() => {
    if (!title) return;
    SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (split) =>
        gsap.from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: 'expo.out' }),
    });
  });
  gsap.from('[data-hero-fade]', {
    y: 24,
    autoAlpha: 0,
    duration: 1,
    stagger: 0.12,
    delay: 0.45,
    ease: 'expo.out',
  });

  const assembly = document.querySelector<HTMLElement>('[data-assembly]');
  if (!assembly) return;
  assembly.dataset.animated = '';
  const win = assembly.querySelector<HTMLElement>('[data-window]')!;
  const chips = gsap.utils.toArray<HTMLElement>('[data-chip]', assembly);
  const modules = gsap.utils.toArray<HTMLElement>('[data-module]', assembly);
  const done = assembly.querySelector('[data-done]');
  const chart = assembly.querySelector<SVGPathElement>('[data-chart]')!;
  const length = chart.getTotalLength();
  gsap.set(chart, { strokeDasharray: length, strokeDashoffset: length });

  // The window turns slightly towards the pointer.
  gsap.set(win, { rotationY: -14, rotationX: 8, rotationZ: 1 });
  const turnY = gsap.quickTo(win, 'rotationY', { duration: 0.8, ease: 'power3.out' });
  const turnX = gsap.quickTo(win, 'rotationX', { duration: 0.8, ease: 'power3.out' });
  const hero = assembly.closest('.smx-stage') as HTMLElement;
  const onMove = (event: PointerEvent) => {
    const box = hero.getBoundingClientRect();
    const dx = (event.clientX - box.left) / box.width - 0.5;
    const dy = (event.clientY - box.top) / box.height - 0.5;
    turnY(-14 + dx * 10);
    turnX(8 - dy * 8);
  };
  hero.addEventListener('pointermove', onMove);

  // Where a chip must travel to land on its module.
  const delta = (chip: HTMLElement, axis: 'x' | 'y') => {
    const module = modules[Number(chip.dataset.target)];
    const a = chip.getBoundingClientRect();
    const b = module.getBoundingClientRect();
    return axis === 'x'
      ? b.left + b.width / 2 - (a.left + a.width / 2) + Number(gsap.getProperty(chip, 'x'))
      : b.top + b.height / 2 - (a.top + a.height / 2) + Number(gsap.getProperty(chip, 'y'));
  };

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, defaults: { ease: 'expo.out' } });
  tl.call(() => modules.forEach((m) => m.classList.remove('is-on')))
    .set(chips, { x: 0, y: 0, scale: 1, autoAlpha: 0 })
    .set(done, { autoAlpha: 0, scale: 0.7 })
    .set(chart, { strokeDashoffset: length })
    .to(chips, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.15, startAt: { y: 24 } })
    .to(chips, {
      y: '-=8',
      duration: 1,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1,
      stagger: 0.1,
    });
  chips.forEach((chip, i) => {
    const module = modules[Number(chip.dataset.target)];
    tl.to(
      chip,
      {
        x: () => delta(chip, 'x'),
        y: () => delta(chip, 'y'),
        scale: 0.35,
        autoAlpha: 0,
        duration: 0.75,
        ease: 'power3.in',
      },
      i ? '-=0.35' : '+=0.1',
    )
      .call(() => module.classList.add('is-on'))
      .fromTo(module, { scale: 1.08 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, '<');
  });
  tl.to(chart, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, '-=0.2')
    .to(done, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2.4)' }, '-=0.6')
    .to({}, { duration: 2.2 })
    .to(done, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' });
  loopWhileVisible(assembly, tl);

  return () => {
    hero.removeEventListener('pointermove', onMove);
    delete assembly.dataset.animated;
  };
});

/* ---------- 2. Disorder put in order ---------- */
const chaos = document.querySelector<HTMLElement>('[data-chaos]');
const board = chaos?.querySelector<HTMLElement>('[data-board]');

const orderTimeline = () => {
  const frame = board!.querySelector<HTMLElement>('[data-frame]')!;
  const slots = gsap.utils.toArray<HTMLElement>('[data-slot]', board);
  const scraps = gsap.utils.toArray<HTMLElement>('[data-scrap]', board);
  const pains = gsap.utils.toArray<HTMLElement>('[data-pain]', chaos);
  const before = board!.querySelector('[data-label-before]');
  const after = board!.querySelector('[data-label-after]');
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    onUpdate() {
      const p = this.progress();
      pains.forEach((pain, i) => pain.classList.toggle('is-solved', p > 0.35 + i * 0.2));
    },
  });
  tl.to(before, { autoAlpha: 0, duration: 0.2 }, 0)
    .to(after, { autoAlpha: 1, duration: 0.2 }, 0.2)
    .to(frame, { autoAlpha: 1, scale: 1, duration: 0.5 }, 0);
  scraps.forEach((scrap, i) => {
    const slot = slots[i];
    tl.to(
      scrap,
      {
        x: () => offsetIn(slot, board!).x - scrap.offsetLeft,
        y: () => offsetIn(slot, board!).y - scrap.offsetTop,
        width: () => slot.offsetWidth,
        height: () => slot.offsetHeight,
        rotate: 0,
        boxShadow: '0 10px 24px -18px rgba(10,16,34,0.35)',
        duration: 0.8,
      },
      0.1 + i * 0.07,
    )
      .to(scrap.querySelector('.smx-scrap-mess'), { autoAlpha: 0, duration: 0.25 }, '>-0.35')
      .to(scrap.querySelector('.smx-scrap-order'), { autoAlpha: 1, duration: 0.25 }, '<0.1')
      .to(scrap, { backgroundColor: '#ffffff', '--accent': '#2f5bff', duration: 0.25 }, '<');
  });
  return tl;
};

if (chaos && board) {
  mm.add(`${MOTION} and (min-width: 901px)`, () => {
    // Desktop: the section holds still while the scroll puts everything in its place.
    const tl = orderTimeline();
    ScrollTrigger.create({
      trigger: chaos,
      start: 'top top+=90',
      end: '+=110%',
      pin: true,
      scrub: 0.6,
      animation: tl,
      invalidateOnRefresh: true,
    });
  });
  mm.add(`${MOTION} and (max-width: 900px)`, () => {
    // Phones: it plays once as the board comes into view.
    const tl = orderTimeline().pause();
    ScrollTrigger.create({
      trigger: board,
      start: 'top 65%',
      once: true,
      onEnter: () => tl.play(),
    });
    tl.duration(2.4);
  });
  mm.add('(prefers-reduced-motion: reduce)', () => {
    orderTimeline().progress(1);
  });
}

/* ---------- 3. Scenes of the applications and the CRM ---------- */
mm.add(MOTION, () => {
  const apps = document.querySelector<HTMLElement>('[data-vis="apps"]');
  if (apps) {
    const rows = apps.querySelectorAll('[data-app-row]');
    const cards = apps.querySelectorAll('[data-app-card]');
    const cta = apps.querySelector('[data-app-cta]');
    const tabs = gsap.utils.toArray<HTMLElement>('[data-app-tab]', apps);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5, defaults: { ease: 'expo.out' } });
    tabs.forEach((tab, i) => {
      tl.call(() => tabs.forEach((t) => t.classList.toggle('is-on', t === tab)))
        .fromTo(
          rows,
          { autoAlpha: 0, x: -18 },
          { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.09 },
          i ? '+=0.2' : 0,
        )
        .fromTo(
          cards,
          { autoAlpha: 0, y: 14, scale: 0.94 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12 },
          '<0.15',
        )
        .fromTo(cta, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, '-=0.2')
        .to({}, { duration: 1.1 })
        .to([rows, cards], { autoAlpha: 0, duration: 0.3, ease: 'power2.in' });
    });
    loopWhileVisible(apps, tl);
  }

  const crm = document.querySelector<HTMLElement>('[data-vis="crm"]');
  if (crm) {
    const wrap = crm.querySelector<HTMLElement>('.smx-crm')!;
    const cols = gsap.utils.toArray<HTMLElement>('[data-crm-col]', crm);
    const card = crm.querySelector<HTMLElement>('[data-crm-card]')!;
    const spot = (i: number) => {
      const col = cols[i];
      const label = col.querySelector('small') as HTMLElement;
      return {
        x: col.offsetLeft + (col.offsetWidth - card.offsetWidth) / 2,
        y: col.offsetTop + label.offsetTop + label.offsetHeight + 10,
      };
    };
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    tl.set(card, {
      x: () => spot(0).x,
      y: () => spot(0).y,
      autoAlpha: 0,
      borderColor: '#cfdaff',
    })
      .to(card, { autoAlpha: 1, duration: 0.4 })
      .fromTo(card, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, '<');
    [1, 2].forEach((i) => {
      tl.to(card, { y: () => spot(i).y - 18, duration: 0.25, ease: 'power2.out' }, '+=0.7')
        .to(card, { x: () => spot(i).x, duration: 0.6, ease: 'power3.inOut' }, '<')
        .to(card, { y: () => spot(i).y, duration: 0.3, ease: 'bounce.out' });
    });
    tl.to(card, { borderColor: '#0f9d63', boxShadow: '0 16px 30px -16px #0f9d6399', duration: 0.3 })
      .to({}, { duration: 1.2 })
      .to(card, { autoAlpha: 0, duration: 0.3 });
    tl.eventCallback('onRepeat', () => gsap.set(card, { clearProps: 'boxShadow' }));
    loopWhileVisible(wrap, tl);
  }
});

/* ---------- 5. Case: the screenshot straightens up as it arrives ---------- */
mm.add(MOTION, () => {
  const shot = document.querySelector('[data-case-shot]');
  if (!shot) return;
  gsap.fromTo(
    shot,
    { rotationX: 18, y: 60, scale: 0.94 },
    {
      rotationX: 0,
      y: 0,
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: shot, start: 'top bottom', end: 'center 60%', scrub: 0.8 },
    },
  );
});
