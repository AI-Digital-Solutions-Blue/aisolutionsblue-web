// Intelligence field: thousands of GPU particles drifting as a formless fluid, lit by passing
// waves of light, able to gather into any shape and dissolve again. WebGL2, no dependencies.
// Everything decorative: when WebGL2 is missing the canvas simply stays empty.

type Theme = 'light' | 'dark';
type Wave = { x: number; y: number; r: number; s: number };
export type ShapeDraw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const VERTEX = /* glsl */ `#version 300 es
precision highp float;
in vec4 aSeed;
in vec2 aTarget0;
in vec2 aTarget1;
in float aFormable;
uniform float uTime;
uniform vec2 uRes;
uniform float uDpr;
uniform float uMix;
uniform float uForm;
uniform float uBirth;
uniform vec2 uOrigin;
uniform vec3 uPointer;
uniform vec4 uWaves[6];
uniform float uScale;
uniform float uFormGlow;
uniform float uFormPresence;
uniform float uHalo;
uniform float uAmbient;
uniform float uSize;
uniform float uJitter;
out float vLight;
out float vAlpha;
out float vTone;
out float vCore;
out float vBokeh;

// Ashima simplex noise (MIT).
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  float t = uTime * 0.035;
  vec2 p = aSeed.xy * vec2(uRes.x / uRes.y, 1.0);
  // Two octaves of flow: a large slow swirl and a finer drift, so the cloud never repeats.
  vec2 swirl = vec2(snoise(vec3(p * 0.9, t)), snoise(vec3(p * 0.9 + 31.7, t))) * 0.16;
  vec2 drift = vec2(snoise(vec3(p * 3.2, t * 1.7 + aSeed.z)), snoise(vec3(p * 3.2 + 9.1, t * 1.7 + aSeed.w))) * 0.035;
  vec2 field = aSeed.xy * uRes + (swirl + drift) * uRes.y * uScale;

  // The pointer parts the cloud gently.
  vec2 toP = field - uPointer.xy;
  float pr = uRes.y * 0.16;
  float near = exp(-dot(toP, toP) / (pr * pr));
  field += normalize(toP + 0.0001) * near * 26.0 * uPointer.z;

  // Formed shape, with a breath of noise so it stays alive.
  vec2 target = mix(aTarget0, aTarget1, uMix);
  target += vec2(snoise(vec3(aSeed.xy * 40.0, t * 6.0)), snoise(vec3(aSeed.yx * 40.0, t * 6.0))) * uJitter;
  float delay = aSeed.z * 0.45;
  float form = aFormable * smoothstep(delay, delay + 0.55, uForm);
  vec2 pos = mix(field, target, form);

  // Birth: particles leave a single point and spread into the field.
  float bd = aSeed.w * 0.55;
  float birth = smoothstep(bd, bd + 0.45, uBirth);
  pos = mix(uOrigin, pos, birth);

  // Light: waves travelling through the field, the pointer, and formed shapes.
  // Density: the field gathers into slow filaments and clouds; sparse regions almost vanish
  // until light passes through them, which is what makes the cloud read as one intelligence.
  vec2 q = pos / uRes.y;
  float dens = snoise(vec3(q * 1.25, t * 0.7 + 4.0)) * 0.6 + snoise(vec3(q * 2.6 + 7.0, t * 1.1)) * 0.4;
  dens = smoothstep(-0.25, 0.55, dens);

  float light = 0.0;
  float band = uRes.y * 0.12;
  for (int i = 0; i < 6; i++) {
    vec4 w = uWaves[i];
    float d = length(pos - w.xy) - w.z;
    light += w.w * exp(-(d * d) / (band * band));
  }
  light += near * 0.55 * uPointer.z;
  light += form * uFormGlow;
  // Bioluminescence: every particle breathes at its own pace, and now and then one flares.
  float breathe = 0.72 + 0.28 * sin(uTime * (0.5 + aSeed.w * 0.9) + aSeed.x * 40.0);
  float flare = pow(max(0.0, sin(uTime * (0.35 + aSeed.y * 0.5) + aSeed.z * 90.0)), 60.0);
  light += flare * 0.9 * uHalo;
  light = clamp(light, 0.0, 1.5);

  // Depth: a few large, soft particles in front of the field, the rest small and sharp.
  float bokeh = step(0.985, aSeed.w) * (1.0 - form);
  float presence = max(mix(0.1, 1.0, dens), form * uFormPresence);
  vLight = light;
  vTone = aSeed.z;
  vAlpha = birth * presence * breathe * (0.45 + aSeed.w * 0.4 + form * 0.2) * mix(1.0, 0.16, bokeh) * mix(uAmbient, 1.0, form);
  float core = (1.2 + aSeed.z * 1.6 * presence + light * 0.9 + form * 0.5) * mix(1.0, 2.8, bokeh);
  // The sprite is larger than the core so a halo can bloom around it; the core keeps its size.
  float spread = 1.0 + uHalo * (1.1 + light * 1.3);
  vCore = 1.0 / spread;
  vBokeh = bokeh;
  gl_PointSize = core * spread * uSize * uDpr;
  vec2 clip = pos / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in float vLight;
in float vAlpha;
in float vTone;
in float vCore;
in float vBokeh;
uniform vec3 uBase;
uniform vec3 uBase2;
uniform vec3 uGlow;
uniform vec3 uPeak;
uniform float uIntensity;
uniform float uHalo;
out vec4 color;
void main(){
  // d: 0 at the centre, 1 at the sprite edge. A crisp core, then a soft halo of coloured light.
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float edge = mix(0.35, 0.0, vBokeh);
  float core = smoothstep(vCore, vCore * edge, d);
  float halo = exp(-d * d * 6.0) * uHalo * (0.025 + vLight * 0.11) * (1.0 - vBokeh);
  float body = clamp(vAlpha + vLight * 0.45, 0.0, 1.0);
  float a = clamp(core * body + halo, 0.0, 1.0) * uIntensity;
  // Indigo to azure per particle; light lifts it to cyan blue and, at its peak, to ice.
  float l = clamp(vLight, 0.0, 1.5);
  vec3 c = mix(mix(uBase, uBase2, vTone), uGlow, min(l, 1.0));
  c = mix(c, uPeak, smoothstep(0.9, 1.5, l) * (1.0 - halo));
  color = vec4(c * a, a);
}`;

// Blue family only, from electric indigo to ice blue: never toward violet or green.
const THEMES: Record<
  Theme,
  {
    base: number[];
    base2: number[];
    glow: number[];
    peak: number[];
    halo: number;
    intensity: number;
  }
> = {
  // On white the light is simulated: saturated cores and a soft cyan-blue halo around lit ones.
  // #3d5bff indigo, #2e8bff azure, #2ea8ff cyan blue, #5cc8ff ice at the brightest.
  light: {
    base: [0.239, 0.357, 1.0],
    base2: [0.18, 0.545, 1.0],
    glow: [0.18, 0.659, 1.0],
    peak: [0.361, 0.784, 1.0],
    halo: 1,
    intensity: 0.95,
  },
  // On ink the light is real (additive): #4f6bff, #2e9bff, #2ea8ff and #a6e8ff at the peak.
  dark: {
    base: [0.31, 0.42, 1.0],
    base2: [0.18, 0.608, 1.0],
    glow: [0.18, 0.659, 1.0],
    peak: [0.651, 0.91, 1.0],
    halo: 0.7,
    intensity: 0.7,
  },
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader) ?? '');
  return shader;
}

/** Sample `count` points inside a shape drawn on an offscreen canvas of size w×h. Opacity is
 * density: a translucent fill becomes a light wash of particles, an opaque line a solid one. */
export function sampleShape(draw: ShapeDraw, w: number, h: number, count: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = ctx.strokeStyle = '#fff';
  draw(ctx, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const inside: number[] = [];
  // Fine enough that hairlines are never skipped between samples.
  const step = canvas.width * canvas.height > 1_500_000 ? 2 : 1;
  for (let y = 0; y < canvas.height; y += step)
    for (let x = 0; x < canvas.width; x += step) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha > 8 && Math.random() * 255 < alpha) inside.push(x, y);
    }
  const out = new Float32Array(count * 2);
  const n = inside.length / 2;
  for (let i = 0; i < count; i++) {
    const k = n ? Math.floor(Math.random() * n) : 0;
    out[i * 2] = (inside[k * 2] ?? w / 2) + (Math.random() - 0.5) * step;
    out[i * 2 + 1] = (inside[k * 2 + 1] ?? h / 2) + (Math.random() - 0.5) * step;
  }
  return out;
}

export type FieldOptions = {
  theme: Theme;
  density: number;
  /** Share of particles that can gather into shapes. */
  formable?: number;
  scale?: number;
  /** Extra light on formed particles; lower keeps shapes quiet. */
  formGlow?: number;
  /** How solid formed particles look (1 = fully present). */
  formPresence?: number;
  /** Brightness of the free-floating cloud next to formed shapes (1 = as bright). */
  ambient?: number;
  /** Particle size multiplier. */
  size?: number;
  /** How far formed particles breathe around their place, in pixels. */
  jitter?: number;
};

export class Field {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private target0: WebGLBuffer;
  private target1: WebGLBuffer;
  private count: number;
  private formable: number;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private running = false;
  private frame = 0;
  private last = 0;
  private time = Math.random() * 100;
  private visible = false;
  private waves: Wave[] = [];
  private nextWave = 1.2;
  private pointer = { x: -9999, y: -9999, s: 0, target: 0 };
  private stillFrame = false;
  /** Animated by callers (GSAP) and read every frame. */
  state = { form: 0, mix: 0, birth: 1, originX: 0, originY: 0 };
  /** Called every animated frame before drawing, e.g. to move shape targets. */
  onFrame?: (time: number, dt: number) => void;

  static create(canvas: HTMLCanvasElement, options: FieldOptions) {
    const gl = canvas.getContext('webgl2', {
      premultipliedAlpha: true,
      antialias: false,
      alpha: true,
    });
    if (!gl) return null;
    try {
      const field = new Field(canvas, gl, options);
      // Development only: lets the browser inspector step the field frame by frame.
      if (import.meta.env.DEV)
        ((window as unknown as { __fields: Field[] }).__fields ??= []).push(field);
      return field;
    } catch {
      return null;
    }
  }

  private constructor(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    options: FieldOptions,
  ) {
    this.canvas = canvas;
    this.gl = gl;
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) ?? '');
    this.program = program;
    gl.useProgram(program);
    for (const name of [
      'uTime',
      'uRes',
      'uDpr',
      'uMix',
      'uForm',
      'uBirth',
      'uOrigin',
      'uPointer',
      'uWaves',
      'uScale',
      'uFormGlow',
      'uFormPresence',
      'uHalo',
      'uAmbient',
      'uSize',
      'uJitter',
      'uBase',
      'uBase2',
      'uGlow',
      'uPeak',
      'uIntensity',
    ])
      this.uniforms[name] = gl.getUniformLocation(program, name);

    // Fewer particles on small screens and weaker devices; the look holds from a few thousand.
    const small = matchMedia('(max-width: 800px)').matches;
    const cores = navigator.hardwareConcurrency ?? 4;
    this.count = Math.round(options.density * (small ? 0.4 : 1) * (cores < 4 ? 0.6 : 1));
    this.formable = Math.round(this.count * (options.formable ?? 0));

    const seeds = new Float32Array(this.count * 4);
    const formable = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) {
      seeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      formable[i] = i < this.formable ? 1 : 0;
    }
    this.attribute('aSeed', seeds, 4);
    this.attribute('aFormable', formable, 1);
    this.target0 = this.attribute('aTarget0', new Float32Array(this.count * 2), 2);
    this.target1 = this.attribute('aTarget1', new Float32Array(this.count * 2), 2);

    const theme = THEMES[options.theme];
    gl.uniform3fv(this.uniforms.uBase, theme.base);
    gl.uniform3fv(this.uniforms.uBase2, theme.base2);
    gl.uniform3fv(this.uniforms.uGlow, theme.glow);
    gl.uniform3fv(this.uniforms.uPeak, theme.peak);
    gl.uniform1f(this.uniforms.uHalo, theme.halo);
    gl.uniform1f(this.uniforms.uIntensity, theme.intensity);
    gl.uniform1f(this.uniforms.uScale, options.scale ?? 1);
    gl.uniform1f(this.uniforms.uFormGlow, options.formGlow ?? 0.55);
    gl.uniform1f(this.uniforms.uFormPresence, options.formPresence ?? 1);
    gl.uniform1f(this.uniforms.uAmbient, options.ambient ?? 1);
    gl.uniform1f(this.uniforms.uSize, options.size ?? 1);
    gl.uniform1f(this.uniforms.uJitter, options.jitter ?? 1.6);
    gl.enable(gl.BLEND);
    if (options.theme === 'dark') gl.blendFunc(gl.ONE, gl.ONE);
    else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.sync();
    }).observe(canvas);
    document.addEventListener('visibilitychange', () => this.sync());
    this.resize();
  }

  private attribute(name: string, data: Float32Array, size: number) {
    const gl = this.gl;
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    const location = gl.getAttribLocation(this.program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    return buffer;
  }

  get size() {
    return { width: this.width, height: this.height };
  }

  /** Points (in canvas CSS pixels) for the formable particles: slot 0 or 1 of the morph. */
  setTarget(slot: 0 | 1, points: Float32Array) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, slot ? this.target1 : this.target0);
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      0,
      points.subarray(0, Math.min(points.length, this.count * 2)),
    );
  }

  get formableCount() {
    return this.formable;
  }

  pointerAt(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.target = 1;
  }

  pointerLeave() {
    this.pointer.target = 0;
  }

  /** Send a wave of light from a point. */
  pulse(x: number, y: number, strength = 1) {
    this.waves.push({ x, y, r: 0, s: strength });
    if (this.waves.length > 6) this.waves.shift();
  }

  /** Reduced motion: one composed, still frame instead of a loop. */
  still(value: boolean) {
    this.stillFrame = value;
    this.sync();
    if (value) {
      this.onFrame?.(this.time, 0);
      this.draw();
    }
  }

  private resize() {
    const bounds = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(devicePixelRatio || 1, 1.75);
    this.width = bounds.width;
    this.height = bounds.height;
    this.canvas.width = Math.max(1, Math.round(bounds.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(bounds.height * this.dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.dispatchEvent(new Event('fieldresize'));
    this.draw();
  }

  private sync() {
    const shouldRun = this.visible && !document.hidden && !this.stillFrame;
    if (shouldRun && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    } else if (!shouldRun && this.running) {
      this.running = false;
      cancelAnimationFrame(this.frame);
    }
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;

    // A new wave every few seconds, from a random point, so the light never feels scheduled.
    this.nextWave -= dt;
    if (this.nextWave <= 0) {
      this.pulse(
        Math.random() * this.width,
        Math.random() * this.height,
        0.75 + Math.random() * 0.35,
      );
      // Frequent, overlapping waves of light: the bioluminescent feel lives in them.
      this.nextWave = 1.5 + Math.random() * 1.5;
    }
    const speed = Math.max(this.width, this.height) * 0.32;
    const reach = Math.hypot(this.width, this.height);
    for (const wave of this.waves) {
      wave.r += speed * dt;
      wave.s *= 1 - 0.2 * dt;
    }
    this.waves = this.waves.filter((wave) => wave.r < reach && wave.s > 0.03);
    this.pointer.s += (this.pointer.target - this.pointer.s) * Math.min(1, dt * 3);

    this.onFrame?.(this.time, dt);
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  private draw() {
    const gl = this.gl;
    const u = this.uniforms;
    if (!this.width) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform2f(u.uRes, this.width, this.height);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform1f(u.uMix, this.state.mix);
    gl.uniform1f(u.uForm, this.state.form);
    gl.uniform1f(u.uBirth, this.state.birth);
    gl.uniform2f(u.uOrigin, this.state.originX, this.state.originY);
    gl.uniform3f(u.uPointer, this.pointer.x, this.pointer.y, this.pointer.s);
    const waves = new Float32Array(24);
    this.waves.forEach((wave, i) => waves.set([wave.x, wave.y, wave.r, wave.s], i * 4));
    gl.uniform4fv(u.uWaves, waves);
    gl.drawArrays(gl.POINTS, 0, this.count);
  }
}
