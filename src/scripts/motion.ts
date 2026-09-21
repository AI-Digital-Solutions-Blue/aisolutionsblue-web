// The dot field is decorative. CSS supplies a static fallback before JavaScript loads.
const hero = document.querySelector<HTMLElement>('.hero');
const canvas = document.querySelector<HTMLCanvasElement>('[data-dot-grid]');
const context = canvas?.getContext('2d');
const preference = matchMedia('(prefers-reduced-motion: no-preference)');
const desktop = matchMedia('(min-width: 801px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
// Set false to disable depth without changing the matrix or its rhythm.
const DEPTH_EXPERIMENT = true;
// A modest tempo lift makes the coordinated light movement easier to perceive.
const GRID_TEMPO = 1.4;
const pointerTarget = { x: 0, y: 0 };
const pointer = { x: 0, y: 0 };
const dotMaterial = document.createElement('canvas');
dotMaterial.width = dotMaterial.height = 32;
const material = dotMaterial.getContext('2d');
if (material) {
  const tile = material.createLinearGradient(2, 2, 30, 30);
  tile.addColorStop(0, '#a0c8f2');
  tile.addColorStop(0.45, '#639ce5');
  tile.addColorStop(1, '#3d7ac3');
  material.fillStyle = tile;
  // Rounded corners and a soft rim preserve the square face without sharp bevels.
  material.beginPath();
  material.roundRect(2, 2, 28, 28, 7);
  material.fill();
  const rim = material.createLinearGradient(2, 2, 30, 30);
  rim.addColorStop(0, '#e7f4ffb3');
  rim.addColorStop(1, '#e7f4ff00');
  material.strokeStyle = rim;
  material.lineWidth = 1;
  material.stroke();
}
const products = document.querySelector<HTMLElement>('[data-product-universe]');
const scenes = [...document.querySelectorAll<HTMLElement>('[data-project-scene]')];
let visible = false;
let frame = 0;
let lastFrame = 0;
let elapsed = 0;
let width = 0;
let height = 0;
let dots: { x: number; y: number; fade: number }[] = [];
const enabled = () => preference.matches;
// Two complementary pairs keep both halves active, with softer companion regions.
// The crossing region has its own rhythm; individual cells never drift or jitter.
const upperRoute = [
  [0.18, 0.22],
  [0.64, 0.28],
  [0.82, 0.18],
  [0.34, 0.3],
];
const crossingRoute = [
  [0.32, 0.52],
  [0.64, 0.4],
  [0.72, 0.6],
  [0.38, 0.44],
];
const processingRoutes = [upperRoute, upperRoute, crossingRoute, upperRoute, upperRoute];
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function draw(time: number) {
  if (!context || !canvas || !width) return;
  context.clearRect(0, 0, width, height);
  // Project one rigid plane: rows remain straight, with no individual particle drift.
  pointer.x += (pointerTarget.x - pointer.x) * 0.075;
  pointer.y += (pointerTarget.y - pointer.y) * 0.075;
  const tiltX = DEPTH_EXPERIMENT ? 0.045 + Math.sin(time * 0.19) * 0.008 + pointer.y * 0.022 : 0;
  const tiltY = DEPTH_EXPERIMENT ? Math.sin(time * 0.16) * 0.018 + pointer.x * 0.024 : 0;
  const cosX = Math.cos(tiltX),
    sinX = Math.sin(tiltX);
  const cosY = Math.cos(tiltY),
    sinY = Math.sin(tiltY);
  const centerX = width / 2,
    centerY = height * 0.45;
  const cameraDistance = Math.max(width, height) * 2.5;
  // Shared wave phases reshape the light fields while the physical matrix stays rigid.
  const fields = processingRoutes.map((route, index) => {
    const position = index === 2 ? time / 4.8 + 1.3 : time / 3.8;
    const step = Math.floor(position);
    const progress = smooth(position - step);
    const start = route[step % route.length];
    const end = route[(step + 1) % route.length];
    const routeX = start[0] + (end[0] - start[0]) * progress;
    const routeY = start[1] + (end[1] - start[1]) * progress;
    // Complementary positions, with a small offset to avoid a mirrored appearance.
    let x = index === 1 ? 1 - routeX + Math.sin(time * 0.31) * 0.035 : routeX;
    let y = index === 1 ? 0.94 - routeY + Math.sin(time * 0.27) * 0.025 : routeY;
    if (index === 3) {
      x = 1 - routeX + Math.sin(time * 0.37 + 1.2) * 0.045;
      y = 0.4 - routeY * 0.5 + Math.sin(time * 0.33) * 0.045;
    } else if (index === 4) {
      x = routeX + Math.sin(time * 0.29 + 2.4) * 0.045;
      y = 0.83 - routeY * 0.5 + Math.sin(time * 0.41) * 0.045;
    }
    const companion = index > 2;
    const packetPhase = (time / (companion ? 3.3 : 2.85) + index / 5) % 1;
    const angle = Math.sin(time * 0.24 + index * 2.1) * 0.18;
    return {
      x: width * x,
      y: height * y,
      radiusX: width * (index === 2 || companion ? 0.32 : 0.46),
      radiusY: height * (index === 2 ? 0.29 : companion ? 0.3 : 0.38),
      strength: index === 2 ? 0.75 : companion ? 0.78 : 1,
      packet: -1.15 + packetPhase * 2.3,
      packetFade: Math.sin(packetPhase * Math.PI) ** 2,
      vertical: index === 1 || index === 3,
      cos: Math.cos(angle),
      sin: Math.sin(angle),
      wavePhase: time * (companion ? 0.94 : 1.04) + index * 2.1,
    };
  });
  // Negative space has its own choreography, independent of the light fields.
  // Bounded, staggered clearings preserve activity in both halves of the hero.
  const clearings = [
    {
      x: width * (0.26 + Math.sin(time * 0.43) * 0.16),
      y: height * (0.46 + Math.cos(time * 0.38) * 0.25),
      radiusX: width * (0.18 + Math.sin(time * 0.61) * 0.025),
      radiusY: height * (0.19 + Math.cos(time * 0.47) * 0.025),
      strength: 0.92,
    },
    {
      x: width * (0.74 - Math.sin(time * 0.43 + 0.8) * 0.16),
      y: height * (0.47 - Math.cos(time * 0.38 + 0.55) * 0.25),
      radiusX: width * (0.18 + Math.cos(time * 0.53) * 0.025),
      radiusY: height * (0.19 + Math.sin(time * 0.57) * 0.025),
      strength: 0.9,
    },
    {
      x: width * (0.5 + Math.sin(time * 0.34 + 2.1) * 0.2),
      y: height * (0.47 + Math.sin(time * 0.49 + 1.4) * 0.22),
      radiusX: width * 0.13,
      radiusY: height * 0.15,
      strength: 0.78,
    },
  ];
  const reveal = Math.min(1, time / 1.1);
  const easedReveal = reveal * reveal * (3 - 2 * reveal);
  for (const dot of dots) {
    let light = 0;
    let activity = 0;
    for (const field of fields) {
      const localX = (dot.x - field.x) / field.radiusX;
      const localY = (dot.y - field.y) / field.radiusY;
      if (Math.abs(localX) > 1.8 || Math.abs(localY) > 1.8) continue;
      const dx = localX * field.cos - localY * field.sin;
      const dy = localX * field.sin + localY * field.cos;
      const waveA = Math.sin(dx * 3.4 + dy * 2.2 - field.wavePhase);
      const waveB = Math.sin(dy * 3.1 - dx * 1.8 + field.wavePhase * 0.73);
      const waveC = Math.sin(dx * 5.1 - dy * 3.7 + field.wavePhase * 1.17);
      const waveD = Math.sin(dx * 2.3 + dy * 5.6 - field.wavePhase * 0.91);
      const waveE = Math.sin((dx * dx + dy * dy) * 2.8 - field.wavePhase * 1.04);
      const waveF = Math.sin(dx * 4.3 + dy * 1.2 + field.wavePhase * 1.31);
      // Crossing waves bend only the contours of light, never the rows of squares.
      const envelope =
        Math.exp(
          -2.2 *
            ((dx + waveB * 0.1 + waveC * 0.06 + waveE * 0.03) ** 4 +
              (dy + waveA * 0.08 + waveD * 0.055 + waveF * 0.03) ** 4),
        ) * field.strength;
      // Normalize the combined waves so extra motion does not increase brightness.
      light = Math.max(
        light,
        envelope *
          (0.86 +
            waveA * 0.035 +
            waveB * 0.025 +
            waveC * 0.025 +
            waveD * 0.015 +
            waveE * 0.025 +
            waveF * 0.015),
      );
      // Broad, slower crests carry blue illumination across rows and columns.
      // Packets fade at their endpoints, so there is no reset flash or global sweep.
      const along = field.vertical ? localY : localX;
      const across = field.vertical ? localX : localY;
      const leading = Math.exp(-(((along - field.packet) / 0.42) ** 2));
      const returning = Math.exp(-(((along + field.packet) / 0.42) ** 2));
      const lanes =
        leading * Math.exp(-(((across + 0.32) / 0.25) ** 2)) +
        returning * Math.exp(-(((across - 0.32) / 0.25) ** 2));
      activity = Math.max(activity, lanes * envelope * field.packetFade);
    }
    let clearing = 0;
    for (const gap of clearings) {
      const dx = (dot.x - gap.x) / gap.radiusX;
      const dy = (dot.y - gap.y) / gap.radiusY;
      if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) continue;
      clearing = Math.max(clearing, Math.exp(-1.7 * (dx ** 4 + dy ** 4)) * gap.strength);
    }
    // Fade cells in place: moving white spaces never disrupt the aligned matrix.
    // Emphasize the traveling crests while keeping the resting grid quiet.
    const alpha =
      Math.min(0.78, 0.03 + light * 0.39 + activity * 0.46) *
      (1 - clearing) *
      dot.fade *
      easedReveal;
    const radius = (0.85 + light * 0.7 + activity * 0.4) * 0.9 * easedReveal;
    if (DEPTH_EXPERIMENT && material) {
      const x = dot.x - centerX,
        y = dot.y - centerY;
      const z = y * sinX;
      const perspective = cameraDistance / (cameraDistance - (z * cosY - x * sinY));
      const px = centerX + (x * cosY + z * sinY) * perspective;
      const py = centerY + y * cosX * perspective;
      const size = radius * perspective * (32 / 14);
      context.globalAlpha = alpha;
      context.drawImage(dotMaterial, px - size / 2, py - size / 2, size, size);
    } else {
      context.fillStyle = `rgba(62,133,215,${alpha})`;
      context.beginPath();
      context.roundRect(dot.x - radius, dot.y - radius, radius * 2, radius * 2, radius * 0.5);
      context.fill();
    }
  }
  context.globalAlpha = 1;
}
function loop(now: number) {
  frame = 0;
  if (!enabled() || !visible || document.hidden) return;
  if (now - lastFrame >= 1000 / (desktop.matches ? 30 : 24)) {
    elapsed += (Math.min(now - lastFrame, 80) / 1000) * GRID_TEMPO;
    lastFrame = now;
    draw(elapsed);
  }
  frame = requestAnimationFrame(loop);
}
function syncLoop() {
  cancelAnimationFrame(frame);
  frame = 0;
  if (enabled() && visible && !document.hidden) {
    lastFrame = performance.now();
    frame = requestAnimationFrame(loop);
  }
}
function sizeCanvas() {
  if (!canvas || !context || !hero) return;
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  dots = [];
  const spacing = (width > 1600 ? 16 : width > 800 ? 13 : 15) * 0.82;
  for (let y = 8; y < height; y += spacing) {
    for (let x = 8; x < width; x += spacing) {
      dots.push({
        x,
        y,
        fade:
          1 -
          0.72 *
            Math.exp(-((x - width / 2) ** 2) / (width * 110)) *
            Math.exp(-((y - 260) ** 2) / 65000),
      });
    }
  }
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw(elapsed);
  canvas.parentElement?.classList.add('is-rendered');
}
function updateScenes() {
  if (!enabled() || !desktop.matches) {
    products?.style.removeProperty('--product-lift');
    scenes.forEach((scene) => scene.style.removeProperty('--scene-scale'));
    return;
  }
  if (products && hero) {
    const offset = Math.max(0, -hero.getBoundingClientRect().top);
    products.style.setProperty('--product-lift', `${-Math.min(offset * 0.055, 32)}px`);
  }
  scenes.forEach((scene) => {
    const visual = scene.querySelector<HTMLElement>('.project-visual');
    if (!visual) return;
    const bounds = visual.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    const progress = Math.max(
      0,
      Math.min(1, (innerHeight - bounds.top) / (innerHeight + bounds.height)),
    );
    scene.style.setProperty('--scene-scale', String(0.94 + progress * 0.075));
  });
}
function syncPreference() {
  document.documentElement.dataset.motion = preference.matches && desktop.matches ? 'on' : 'off';
  document.documentElement.dataset.gridMotion = preference.matches ? 'on' : 'off';
  updateScenes();
  syncLoop();
}
if (hero && canvas && context) {
  hero.addEventListener(
    'pointermove',
    (event) => {
      if (!enabled() || !finePointer.matches || !DEPTH_EXPERIMENT) return;
      const bounds = hero.getBoundingClientRect();
      pointerTarget.x = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2),
      );
      pointerTarget.y = Math.max(
        -1,
        Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2),
      );
    },
    { passive: true },
  );
  hero.addEventListener('pointerleave', () => {
    pointerTarget.x = pointerTarget.y = 0;
  });
  new ResizeObserver(sizeCanvas).observe(hero);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      syncLoop();
    },
    { threshold: 0 },
  ).observe(hero);
  document.addEventListener('visibilitychange', syncLoop);
  sizeCanvas();
}
preference.addEventListener('change', syncPreference);
desktop.addEventListener('change', syncPreference);
let scrollFrame = 0;
window.addEventListener(
  'scroll',
  () => {
    if (!enabled() || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateScenes();
    });
  },
  { passive: true },
);
syncPreference();
export {};
