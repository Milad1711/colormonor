/**
 * Tiny procedural sound engine (Web Audio API, zero external assets).
 * All effects are gentle: master gain is low, nothing harsh or loud.
 * The AudioContext is created lazily on the first user gesture so mobile
 * autoplay policies are respected.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function primeAudio() {
  ensureCtx();
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 1,
  delay = 0,
  endFreq?: number,
) {
  const ac = ensureCtx();
  if (!ac || !master || !enabled) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + duration);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noise(duration: number, gain = 0.5, delay = 0, lowpass = 1200) {
  const ac = ensureCtx();
  if (!ac || !master || !enabled) return;
  const t0 = ac.currentTime + delay;
  const frames = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(lowpass, t0);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
}

export const sfx = {
  tap() {
    tone(660, 0.07, "triangle", 0.5);
  },
  select() {
    tone(520, 0.09, "sine", 0.7);
    tone(780, 0.09, "sine", 0.4, 0.03);
  },
  pour(units = 1) {
    // soft water trickle
    const d = Math.min(0.16 + units * 0.12, 0.6);
    noise(d, 0.35, 0, 900);
    tone(300, d, "sine", 0.25, 0, 180);
  },
  error() {
    tone(150, 0.16, "square", 0.22);
    tone(110, 0.18, "square", 0.18, 0.02);
  },
  tubeComplete() {
    tone(523, 0.14, "sine", 0.7);
    tone(659, 0.14, "sine", 0.7, 0.09);
    tone(784, 0.2, "sine", 0.7, 0.18);
    tone(1568, 0.25, "sine", 0.3, 0.18);
  },
  win() {
    const seq: Array<[number, number]> = [
      [523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [1319, 0.5],
    ];
    for (const [f, d] of seq) tone(f, 0.28, "triangle", 0.6, d);
    tone(2093, 0.5, "sine", 0.25, 0.62);
  },
  coin() {
    tone(1047, 0.09, "square", 0.3);
    tone(1568, 0.14, "square", 0.3, 0.07);
  },
  buy() {
    tone(784, 0.1, "triangle", 0.5);
    tone(988, 0.1, "triangle", 0.5, 0.08);
    tone(1319, 0.18, "triangle", 0.5, 0.16);
  },
  place() {
    tone(220, 0.12, "sine", 0.6, 0, 130);
    noise(0.12, 0.25, 0.02, 600);
    tone(1319, 0.12, "sine", 0.2, 0.1);
  },
  unlock() {
    tone(392, 0.12, "triangle", 0.5);
    tone(523, 0.12, "triangle", 0.5, 0.1);
    tone(659, 0.12, "triangle", 0.5, 0.2);
    tone(880, 0.3, "triangle", 0.5, 0.3);
  },
  undo() {
    tone(500, 0.1, "sine", 0.4, 0, 320);
  },
  /** short click used while the lucky wheel sweeps over pins */
  tick() {
    noise(0.03, 0.22, 0, 2400);
    tone(1900, 0.03, "square", 0.12);
  },
  /** rising spin-start whoosh */
  spinStart() {
    tone(220, 0.5, "sine", 0.3, 0, 880);
    noise(0.4, 0.2, 0, 1600);
  },
  /** bright chest-opening / pack-claim flourish */
  chest() {
    tone(392, 0.09, "triangle", 0.5);
    tone(523, 0.09, "triangle", 0.5, 0.07);
    tone(659, 0.09, "triangle", 0.5, 0.14);
    tone(1047, 0.22, "triangle", 0.55, 0.21);
    tone(2093, 0.3, "sine", 0.2, 0.24);
  },
  /** big win for wheel jackpots */
  jackpot() {
    const seq: Array<[number, number]> = [
      [523, 0], [659, 0.1], [784, 0.2], [1047, 0.3], [784, 0.42], [1047, 0.52], [1319, 0.62],
    ];
    for (const [f, d] of seq) tone(f, 0.22, "triangle", 0.6, d);
    tone(2093, 0.6, "sine", 0.28, 0.74);
  },
};
