/**
 * Generates the 50 Color Manor levels.
 *
 * Strategy
 * --------
 * For every level we draw a seeded random arrangement of C colors x 4 units
 * into C full tubes (+ 2 empty helper tubes), then prove solvability with the
 * DFS solver and keep candidates whose optimal solution length (par) matches
 * the tier difficulty target. Adjacent levels must differ structurally.
 * The final file only ever contains levels that were PROVEN solvable.
 *
 * Run:  bun scripts/generate-levels.ts
 */
import { solve, isSolved, type State } from "../src/game/solver";
import { writeFileSync } from "node:fs";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTE_SIZE = 8; // global liquid palette (indices 0..7)

interface LevelDef {
  colors: number; // distinct color count
  target: number; // target optimal solution length
}

// Difficulty curve — exactly the tier plan requested by the design doc.
const LEVELS: LevelDef[] = [
  // 1-5: tutorial, 2-3 colors, very short solutions
  { colors: 2, target: 3 },
  { colors: 2, target: 4 },
  { colors: 3, target: 5 },
  { colors: 3, target: 6 },
  { colors: 3, target: 8 },
  // 6-15: 3-4 colors
  { colors: 3, target: 9 },
  { colors: 4, target: 10 },
  { colors: 3, target: 11 },
  { colors: 4, target: 12 },
  { colors: 4, target: 13 },
  { colors: 3, target: 12 },
  { colors: 4, target: 14 },
  { colors: 4, target: 15 },
  { colors: 4, target: 16 },
  { colors: 4, target: 17 },
  // 16-25: 4-5 colors
  { colors: 4, target: 15 },
  { colors: 5, target: 17 },
  { colors: 4, target: 18 },
  { colors: 5, target: 19 },
  { colors: 4, target: 20 },
  { colors: 5, target: 21 },
  { colors: 5, target: 22 },
  { colors: 4, target: 20 },
  { colors: 5, target: 23 },
  { colors: 5, target: 24 },
  // 26-35: 5-6 colors
  { colors: 5, target: 22 },
  { colors: 6, target: 25 },
  { colors: 5, target: 26 },
  { colors: 6, target: 27 },
  { colors: 5, target: 25 },
  { colors: 6, target: 28 },
  { colors: 6, target: 29 },
  { colors: 5, target: 27 },
  { colors: 6, target: 30 },
  { colors: 6, target: 32 },
  // 36-50: 6-7 colors, expert
  { colors: 6, target: 30 },
  { colors: 7, target: 34 },
  { colors: 6, target: 33 },
  { colors: 7, target: 36 },
  { colors: 6, target: 34 },
  { colors: 7, target: 38 },
  { colors: 6, target: 36 },
  { colors: 7, target: 40 },
  { colors: 7, target: 38 },
  { colors: 6, target: 37 },
  { colors: 7, target: 42 },
  { colors: 7, target: 44 },
  { colors: 7, target: 43 },
  { colors: 7, target: 46 },
  { colors: 7, target: 48 },
];

interface Candidate {
  tubes: State;
  palette: number[]; // global color ids used, sorted
  par: number;
  score: number; // distance from difficulty target (lower = better)
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealArrangement(colors: number, rnd: () => number): State {
  // multiset: each chosen color x4, dealt into `colors` full tubes
  const units: number[] = [];
  for (let c = 0; c < colors; c++) for (let k = 0; k < 4; k++) units.push(c);
  const shuffled = shuffle(units, rnd);
  const tubes: State = [];
  for (let t = 0; t < colors; t++) tubes.push(shuffled.slice(t * 4, t * 4 + 4));
  for (let e = 0; e < 2; e++) tubes.push([]);
  return tubes;
}

function tubeKey(st: State): string {
  return st.map((t) => t.join(",")).join("|");
}

function generateLevel(levelNo: number, def: LevelDef): Candidate {
  const rnd = mulberry32(levelNo * 7919 + 104729);
  const attempts = def.colors >= 6 ? 260 : def.colors >= 4 ? 420 : 700;
  const nodeLimit = 90000;
  let best: Candidate | null = null;
  const seen = new Set<string>();
  const prevKey =
    levelNo > 1 ? tubeKey(generated[levelNo - 2].tubes.map((t) => [...t])) : "";

  for (let i = 0; i < attempts; i++) {
    const palette = shuffle(
      Array.from({ length: PALETTE_SIZE }, (_, k) => k),
      rnd,
    ).slice(0, def.colors);
    const raw = dealArrangement(def.colors, rnd);
    // map local colors -> global palette ids
    const tubes = raw.map((t) => t.map((c) => palette[c]));
    const key = tubeKey(tubes);
    if (seen.has(key)) continue;
    seen.add(key);
    if (isSolved(tubes)) continue;
    // no tube should start complete (looks pre-solved)
    if (tubes.some((t) => t.length === 4 && t.every((c) => c === t[0]))) continue;
    // must differ structurally from the previous level
    if (levelNo > 1 && key === prevKey) continue;

    const { solution } = solve(tubes, nodeLimit);
    if (!solution) continue; // unprovable within limit -> reject, stay safe
    const par = solution.length;
    const dist = Math.abs(par - def.target);
    const tight = dist <= Math.max(2, Math.round(def.target * 0.15));
    if (!best || dist < best.score) {
      best = { tubes, palette: [...palette].sort(), par, score: dist };
    }
    if (tight) break; // good enough, keep generation fast
  }

  if (!best) {
    throw new Error(
      `Level ${levelNo}: no provably solvable candidate found (${attempts} attempts)`,
    );
  }
  return best;
}

const generated: Candidate[] = [];
const t0 = Date.now();
for (let i = 1; i <= LEVELS.length; i++) {
  const cand = generateLevel(i, LEVELS[i - 1]);
  generated.push(cand);
  console.log(
    `Level ${String(i).padStart(2)}: colors=${cand.palette.length} par=${cand.par} (target ${LEVELS[i - 1].target}, drift ${cand.score})`,
  );
}
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

// ---- final verification pass: every shipped level must be solvable ----
let ok = 0;
for (let i = 0; i < generated.length; i++) {
  const { solution } = solve(generated[i].tubes, 250000);
  if (!solution || solution.length === 0) throw new Error(`Verification failed for level ${i + 1}`);
  if (solution.length !== generated[i].par)
    throw new Error(`Par mismatch on level ${i + 1}: stored ${generated[i].par} verified ${solution.length}`);
  ok++;
}
console.log(`Verified ${ok}/${generated.length} levels solvable in ${elapsed}s`);

const out = {
  version: 1,
  levels: generated.map((c, i) => ({
    id: i + 1,
    colors: c.palette.length,
    par: c.par,
    tubes: c.tubes,
  })),
};
writeFileSync(
  new URL("../src/game/levels-data.ts", import.meta.url).pathname,
  `// AUTO-GENERATED by scripts/generate-levels.ts — do not edit by hand.\n` +
    `// All 50 levels are proven solvable by src/game/solver.ts.\n` +
    `export interface LevelData { id: number; colors: number; par: number; tubes: number[][] }\n` +
    `export const LEVELS_DATA: LevelData[] = ${JSON.stringify(out.levels)};\n`,
  "utf8",
);
console.log("Wrote src/game/levels-data.ts");
