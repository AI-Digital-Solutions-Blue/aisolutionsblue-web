// Scroll motion for the home sections below the opening. Content is visible without it.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Section headings rise line by line out of a mask, once, as they enter.
  document.fonts.ready.then(() => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((heading) => {
      SplitText.create(heading, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (split) =>
          gsap.from(split.lines, {
            yPercent: 105,
            duration: 1.1,
            stagger: 0.08,
            ease: 'expo.out',
            scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
          }),
      });
    });
  });

  // Product captures: the main screen settles into place, the detail drifts at its own depth.
  gsap.utils.toArray<HTMLElement>('[data-product-media]').forEach((media) => {
    const main = media.querySelector('.product-frame-main');
    const detail = media.querySelector('[data-product-detail]');
    gsap.fromTo(
      main,
      { scale: 0.93, opacity: 0.6 },
      {
        scale: 1,
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top bottom', end: 'center 60%', scrub: 0.6 },
      },
    );
    if (detail)
      gsap.fromTo(
        detail,
        { yPercent: 18 },
        {
          yPercent: -14,
          ease: 'none',
          scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        },
      );
  });

  // Process: the line fills with the scroll and each step lights up as the line reaches it.
  const track = document.querySelector<HTMLElement>('[data-process]');
  const fill = track?.querySelector<HTMLElement>('[data-process-fill]');
  const steps = gsap.utils.toArray<HTMLElement>('.process-step', track);
  if (track && fill) {
    track.dataset.animated = '';
    ScrollTrigger.create({
      trigger: track,
      start: 'top 75%',
      end: 'bottom 55%',
      scrub: 0.4,
      onUpdate: (self) => {
        fill.style.setProperty('--p', String(self.progress));
        steps.forEach((step, i) =>
          step.classList.toggle('is-reached', self.progress >= i / steps.length + 0.02),
        );
      },
    });
    return () => {
      delete track.dataset.animated;
      steps.forEach((step) => step.classList.remove('is-reached'));
    };
  }
});

// Service scenes: each loops only while it is on screen. Without motion they show their end state.
const scenes = gsap.utils.toArray<HTMLElement>('[data-vis]');
const loopWhileVisible = (el: HTMLElement, tl: gsap.core.Timeline) => {
  tl.pause();
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    end: 'bottom 15%',
    onToggle: (self) => (self.isActive ? tl.resume() : tl.pause()),
  });
};

mm.add('(prefers-reduced-motion: reduce)', () => {
  scenes.forEach((scene) =>
    scene.querySelectorAll('[data-node]').forEach((node) => node.classList.add('is-on')),
  );
});

mm.add('(prefers-reduced-motion: no-preference)', () => {
  scenes.forEach((scene) => {
    const kind = scene.dataset.vis;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, defaults: { ease: 'expo.out' } });

    if (kind === 'agentes') {
      // A call rings, Blue's assistant takes it, and the conversation that follows books the slot.
      const call = scene.querySelector('[data-call]');
      const badge = scene.querySelector('[data-badge]');
      const bubbles = scene.querySelectorAll('[data-bubble]');
      tl.set([badge, ...bubbles], { autoAlpha: 0 })
        .fromTo(
          call,
          { rotation: -1.5 },
          { rotation: 1.5, duration: 0.07, repeat: 9, yoyo: true, ease: 'none' },
        )
        .set(call, { rotation: 0 })
        .fromTo(
          badge,
          { autoAlpha: 0, scale: 0.6 },
          { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.6)' },
        )
        .fromTo(
          bubbles,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.75 },
          '+=0.2',
        )
        .to([badge, ...bubbles], { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, '+=1.8');
    }

    if (kind === 'automatizacion') {
      // A booking moves through by itself: each step lights up as the ring reaches it.
      const flow = scene.querySelector<HTMLElement>('.vis-flow')!;
      const nodes = gsap.utils.toArray<HTMLElement>('[data-node]', scene);
      const runner = scene.querySelector('[data-runner]');
      const track = scene.querySelector<HTMLElement>('.vis-track')!;
      const fill = scene.querySelector('[data-fill]');
      const auto = scene.querySelector('[data-auto]');
      const centre = (node: HTMLElement) => {
        const dot = node.querySelector('.vis-node-dot')!.getBoundingClientRect();
        return dot.top + dot.height / 2 - flow.getBoundingClientRect().top;
      };
      const ys = () => nodes.map(centre);
      const place = () => {
        const [first, , last] = ys();
        gsap.set(track, { top: first, bottom: 'auto', height: last - first });
      };
      place();
      ScrollTrigger.addEventListener('refresh', place);
      tl.call(() => nodes.forEach((node) => node.classList.remove('is-on')))
        .set(auto, { autoAlpha: 0 })
        .set(fill, { scaleY: 0 })
        .set(runner, { top: 0, y: () => ys()[0] });
      nodes.forEach((node, i) => {
        if (i) {
          tl.to(runner, { y: () => ys()[i], duration: 0.7, ease: 'power3.inOut' }, '+=0.5');
          tl.to(fill, { scaleY: i / (nodes.length - 1), duration: 0.7, ease: 'power3.inOut' }, '<');
        }
        tl.call(() => node.classList.add('is-on'));
        tl.fromTo(runner, { scale: 1.4 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' }, '<');
      });
      tl.fromTo(
        auto,
        { autoAlpha: 0, scale: 0.7 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.6)' },
        '+=0.2',
      );
      tl.to({}, { duration: 1.6 });
    }

    if (kind === 'software') {
      // A dashboard builds itself: trend lines draw and the bars rise.
      const sparks = scene.querySelectorAll<SVGPathElement>('[data-spark]');
      const bars = scene.querySelectorAll('[data-bar]');
      sparks.forEach((path) => gsap.set(path, { strokeDasharray: path.getTotalLength() }));
      tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.8, stagger: 0.08 })
        .fromTo(
          sparks,
          { strokeDashoffset: (_, path: SVGPathElement) => path.getTotalLength() },
          { strokeDashoffset: 0, duration: 1.2, stagger: 0.2, ease: 'power2.inOut' },
          '<0.2',
        )
        .to(bars, { scaleY: 0, duration: 0.4, stagger: 0.03, ease: 'power2.in' }, '+=2')
        .to(
          sparks,
          { strokeDashoffset: (_, path: SVGPathElement) => path.getTotalLength(), duration: 0.4 },
          '<',
        );
    }

    loopWhileVisible(scene, tl);
  });
});

// About: the product screens start stacked like a hand of cards and fan out with the scroll.
mm.add('(prefers-reduced-motion: no-preference) and (min-width: 641px)', () => {
  const cards = gsap.utils.toArray<HTMLElement>('[data-fan-card]');
  const fan = document.querySelector('[data-fan]');
  if (!fan || !cards.length) return;
  gsap.fromTo(
    cards,
    {
      x: (i: number) => (1.5 - i) * 0.9 * cards[0].offsetWidth,
      rotation: (i: number) => (i - 1.5) * 7,
      y: (i: number) => Math.abs(i - 1.5) * 18,
    },
    {
      x: 0,
      rotation: 0,
      y: 0,
      ease: 'none',
      scrollTrigger: { trigger: fan, start: 'top 90%', end: 'center 55%', scrub: 0.6 },
    },
  );
});

// Section headings get a little parallax as they pass: chapters, not paragraphs.
mm.add('(prefers-reduced-motion: no-preference) and (min-width: 901px)', () => {
  gsap.utils.toArray<HTMLElement>('.section-intro').forEach((intro) => {
    gsap.fromTo(
      intro,
      { y: 40 },
      {
        y: -20,
        ease: 'none',
        scrollTrigger: { trigger: intro, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      },
    );
  });
});
