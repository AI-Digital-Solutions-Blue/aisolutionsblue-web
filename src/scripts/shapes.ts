// Forms the field takes in the stage, one per chapter, drawn in a w×h box. Fine line drawings of
// real objects rather than solid blocks: the particles trace their outlines, like light on glass.
import type { ShapeDraw } from './field';

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

const hairline = (h: number) => Math.max(1.6, h * 0.0085);

// Atiende: a phone ringing, with the call answered and its voice spreading out.
const call: ShapeDraw = (ctx, w, h) => {
  ctx.lineWidth = hairline(h);
  ctx.lineCap = 'round';
  const ph = h * 0.96;
  const pw = ph * 0.49;
  const px = (w - pw) / 2;
  const py = (h - ph) / 2;
  const cx = w / 2;
  round(ctx, px, py, pw, ph, pw * 0.17);
  ctx.stroke();
  round(ctx, px + pw * 0.035, py + pw * 0.035, pw * 0.93, ph - pw * 0.07, pw * 0.14);
  ctx.stroke();
  // Dynamic Island, caller, name and the two answer buttons.
  round(ctx, cx - pw * 0.15, py + ph * 0.045, pw * 0.3, ph * 0.035, ph * 0.0175);
  ctx.fill();
  circle(ctx, cx, py + ph * 0.27, pw * 0.15);
  ctx.stroke();
  circle(ctx, cx, py + ph * 0.255, pw * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, py + ph * 0.33, pw * 0.085, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  round(ctx, cx - pw * 0.24, py + ph * 0.4, pw * 0.48, ph * 0.016, ph * 0.008);
  ctx.fill();
  round(ctx, cx - pw * 0.15, py + ph * 0.44, pw * 0.3, ph * 0.011, ph * 0.006);
  ctx.fill();
  circle(ctx, px + pw * 0.27, py + ph * 0.8, pw * 0.09);
  ctx.stroke();
  circle(ctx, px + pw * 0.73, py + ph * 0.8, pw * 0.09);
  ctx.fill();
  round(ctx, cx - pw * 0.17, py + ph * 0.955, pw * 0.34, ph * 0.008, ph * 0.004);
  ctx.fill();
  // The voice: arcs on both sides of the phone.
  for (let i = 0; i < 3; i++) {
    const r = pw * (0.72 + i * 0.2);
    const spread = 0.24 - i * 0.03;
    for (const side of [0, Math.PI]) {
      ctx.beginPath();
      ctx.arc(cx, py + ph * 0.27, r, side - spread, side + spread);
      ctx.stroke();
    }
  }
};

// Atrae: customers arriving, a curve that keeps rising with each new one marked on it.
const growth: ShapeDraw = (ctx, w, h) => {
  ctx.lineWidth = hairline(h);
  ctx.lineCap = 'round';
  const left = w * 0.04;
  const right = w * 0.96;
  const top = h * 0.12;
  const base = h * 0.92;
  // A quiet grid: dotted guides the curve rises through.
  for (let i = 0; i < 4; i++) {
    const y = top + ((base - top) * i) / 4;
    for (let x = left; x < right; x += w * 0.02) {
      circle(ctx, x, y, ctx.lineWidth * 0.45);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.moveTo(left, base);
  ctx.lineTo(right, base);
  ctx.stroke();
  const curve = (t: number) => {
    const x = left + (right - left) * t;
    const lift = t ** 1.8 * 0.86 + Math.sin(t * Math.PI * 3) * 0.035 * (1 - t);
    return [x, base - (base - top) * lift] as const;
  };
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const [x, y] = curve(i / 120);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.lineWidth = hairline(h) * 1.6;
  ctx.stroke();
  ctx.lineWidth = hairline(h);
  // Each new customer, a point on the curve; the latest one ringed.
  [0.22, 0.42, 0.6, 0.76, 0.9].forEach((t) => {
    const [x, y] = curve(t);
    circle(ctx, x, y, h * 0.016);
    ctx.fill();
  });
  const [lx, ly] = curve(1);
  circle(ctx, lx - w * 0.005, ly, h * 0.045);
  ctx.stroke();
  circle(ctx, lx - w * 0.005, ly, h * 0.02);
  ctx.fill();
  // A small tag above the latest point: a new customer.
  const tw = w * 0.2;
  const th = h * 0.1;
  const tx = lx - tw - w * 0.05;
  const ty = ly - th * 0.5;
  round(ctx, tx, ty, tw, th, th / 2);
  ctx.stroke();
  circle(ctx, tx + th * 0.5, ty + th / 2, th * 0.2);
  ctx.fill();
  round(ctx, tx + th * 0.95, ty + th * 0.42, tw * 0.5, th * 0.16, th * 0.08);
  ctx.fill();
};

// Organiza: a week in the calendar, every slot in its place and today's booking confirmed.
const agenda: ShapeDraw = (ctx, w, h) => {
  ctx.lineWidth = hairline(h);
  ctx.lineCap = 'round';
  const fw = Math.min(w, h * 1.45);
  const fx = (w - fw) / 2;
  round(ctx, fx, 0, fw, h, h * 0.06);
  ctx.stroke();
  const head = h * 0.16;
  ctx.beginPath();
  ctx.moveTo(fx, head);
  ctx.lineTo(fx + fw, head);
  ctx.stroke();
  // Window dots and the title in the header.
  [0, 1, 2].forEach((i) => {
    circle(ctx, fx + h * (0.06 + i * 0.045), head / 2, h * 0.013);
    ctx.fill();
  });
  round(ctx, fx + fw * 0.38, head / 2 - h * 0.012, fw * 0.24, h * 0.024, h * 0.012);
  ctx.fill();
  const cols = 4;
  const gx = fw / cols;
  // Bookings: [column, start, length] as a share of the body height.
  const body = h - head;
  const slots: [number, number, number][] = [
    [0, 0.1, 0.3],
    [0, 0.54, 0.28],
    [1, 0.24, 0.36],
    [2, 0.1, 0.56],
    [3, 0.1, 0.24],
    [3, 0.48, 0.3],
  ];
  slots.forEach(([c, s, l], i) => {
    const x = fx + c * gx + gx * 0.1;
    const y = head + body * s;
    round(ctx, x, y, gx * 0.8, body * l, h * 0.025);
    ctx.stroke();
    round(ctx, x + gx * 0.1, y + h * 0.03, gx * 0.44, h * 0.018, h * 0.009);
    ctx.fill();
    // Today's confirmed booking, a light wash of particles inside it.
    if (i === 3) {
      round(ctx, x, y, gx * 0.8, body * l, h * 0.025);
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
};

// Same order as useCases in src/data/site.ts.
export const stageShapes: ShapeDraw[] = [call, growth, agenda];
