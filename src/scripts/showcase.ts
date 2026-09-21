const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll<HTMLElement>('[data-slide]'));
  const controls = carousel.querySelector<HTMLElement>('.showcase-carousel-controls');
  const counter = carousel.querySelector<HTMLElement>('[data-slide-count]');
  const status = carousel.querySelector<HTMLElement>('[data-carousel-status]');
  const stage = carousel.querySelector<HTMLElement>('.showcase-stage');
  if (!controls || !stage || slides.length < 2) return;
  controls.hidden = false;
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let visible = false;
  let busy = false;
  let activeAnimations: Animation[] = [];

  const clearTimer = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const schedule = () => {
    clearTimer();
    if (visible && !busy && !document.hidden && !reducedMotion.matches)
      timer = setTimeout(() => {
        void change(1);
      }, 4500);
  };
  const preloadNext = () => {
    const image = slides[(index + 1) % slides.length].querySelector('img');
    if (image) image.loading = 'eager';
  };
  const change = async (direction: number, manual = false) => {
    if (busy) return;
    clearTimer();
    busy = true;
    const nextIndex = (index + direction + slides.length) % slides.length;
    const previous = slides[index];
    const next = slides[nextIndex];
    const image = next.querySelector('img');
    try {
      if (image) {
        image.loading = 'eager';
        await image.decode();
      }
      // Leave the current image in place if the user scrolls away during loading.
      if (!manual && (!visible || document.hidden || reducedMotion.matches)) return;
      next.hidden = false;
      next.setAttribute('aria-hidden', 'false');
      previous.setAttribute('aria-hidden', 'true');
      if (!reducedMotion.matches) {
        const options = { duration: 850, easing: 'cubic-bezier(.22,.7,.2,1)' };
        activeAnimations = [
          previous.animate(
            [{ transform: 'translateX(0)' }, { transform: `translateX(${direction * 100}%)` }],
            options,
          ),
          next.animate(
            [{ transform: `translateX(${-direction * 100}%)` }, { transform: 'translateX(0)' }],
            options,
          ),
        ];
        await Promise.allSettled(activeAnimations.map((animation) => animation.finished));
      }
      previous.hidden = true;
      activeAnimations = [];
      index = nextIndex;
      if (counter) counter.textContent = String(index + 1).padStart(2, '0');
      if (status)
        status.textContent = manual
          ? `Imagen ${index + 1} de ${slides.length}: ${image?.alt || ''}`
          : '';
      preloadNext();
    } catch {
      if (status && manual)
        status.textContent = 'No se pudo cargar la imagen. Vuelve a intentarlo.';
    } finally {
      busy = false;
      schedule();
    }
  };
  const manualChange = (direction: number) => {
    void change(direction, true);
    schedule();
  };
  carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => manualChange(-1));
  carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => manualChange(1));
  carousel.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    manualChange(event.key === 'ArrowRight' ? 1 : -1);
  });
  let touchStart: { x: number; y: number } | undefined;
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') touchStart = { x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', (event) => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = undefined;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) manualChange(dx > 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => {
    touchStart = undefined;
  });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) activeAnimations.forEach((animation) => animation.finish());
    schedule();
  });
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) preloadNext();
      schedule();
    },
    { threshold: 0.35 },
  );
  observer.observe(stage);
  schedule();
});
