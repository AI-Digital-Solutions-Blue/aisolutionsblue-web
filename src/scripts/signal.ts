// Preserve the soft ambient background without a travelling light.
const section = document.querySelector<HTMLElement>('.intelligence-section');
const flow = section?.querySelector<HTMLElement>('[data-signal]');
const ambient = section?.querySelector<HTMLElement>('[data-signal-ambient]');
const motionAllowed = matchMedia('(prefers-reduced-motion: no-preference)');
let animation: Animation | undefined;
let visible = false;

function updatePlayback() {
  const active = motionAllowed.matches && visible && !document.hidden;
  if (active) animation?.play();
  else animation?.pause();
}

function buildAmbient() {
  const previous = typeof animation?.currentTime === 'number' ? animation.currentTime : 0;
  animation?.cancel();
  animation = undefined;
  if (!ambient || !motionAllowed.matches) return;
  animation = ambient.animate(
    [
      { transform: 'translate3d(-3%,0,0)', opacity: 0.4 },
      { transform: 'translate3d(4%,2%,0)', opacity: 0.7 },
      { transform: 'translate3d(-3%,0,0)', opacity: 0.4 },
    ],
    { duration: 18000, iterations: Infinity, easing: 'ease-in-out' },
  );
  animation.pause();
  animation.currentTime = previous;
  updatePlayback();
}

if (section && flow && ambient) {
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      updatePlayback();
    },
    { threshold: 0.12 },
  ).observe(flow);
  document.addEventListener('visibilitychange', updatePlayback);
  motionAllowed.addEventListener('change', buildAmbient);
  buildAmbient();
}
export {};
