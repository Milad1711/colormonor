/**
 * Water Sort puzzle engine + solver.
 *
 * Core rules (game and solver share the exact same logic):
 * - Each tube holds at most 4 units of liquid.
 * - A pour is allowed only when the destination is empty or its top color
 *   equals the source's top color, and the destination is not full.
 * - Every pour transfers the maximum contiguous run of the source's top
 *   color that fits in the destination.
 * - A tube is "complete" when it holds 4 units of a single color.
 * - The level is solved when every non-empty tube is complete.
 */

export type Tube = number[]; // colors bottom -> top
export type State = Tube[];
export interface Move {
  from: number;
  to: number;
  count: number;
}

export const TUBE_CAPACITY = 4;

export function isTubeComplete(t: Tube): boolean {
  return t.length === TUBE_CAPACITY && t.every((c) => c === t[0]);
}

export function isSolved(st: State): boolean {
  return st.every((t) => t.length === 0 || isTubeComplete(t));
}

/**
 * Validate a move under the game rules and return the transfer size,
 * or null when the move is illegal.
 */
export function validateMove(st: State, from: number, to: number): number | null {
  if (from === to) return null;
  const src = st[from];
  const dst = st[to];
  if (!src || !dst) return null;
  if (src.length === 0) return null;
  if (dst.length >= TUBE_CAPACITY) return null;
  const top = src[src.length - 1];
  if (dst.length > 0 && dst[dst.length - 1] !== top) return null;
  // contiguous run of the top color
  let run = 1;
  for (let i = src.length - 2; i >= 0 && src[i] === top; i--) run++;
  return Math.min(run, TUBE_CAPACITY - dst.length);
}

export function applyMove(st: State, mv: Move): State {
  return st.map((t, i) => {
    if (i === mv.from) return t.slice(0, t.length - mv.count);
    if (i === mv.to) return [...t, ...Array(mv.count).fill(st[mv.from][st[mv.from].length - 1])];
    return t;
  });
}

function canonical(st: State): string {
  return st.map((t) => t.join(',')).sort().join('|');
}

interface ScoredMove {
  mv: Move;
  score: number;
}

function genMoves(st: State): ScoredMove[] {
  const out: ScoredMove[] = [];
  const n = st.length;
  for (let from = 0; from < n; from++) {
    const src = st[from];
    if (src.length === 0) continue;
    const top = src[src.length - 1];
    let run = 1;
    for (let i = src.length - 2; i >= 0 && src[i] === top; i--) run++;
    // never pour out of an already complete tube
    if (src.length === TUBE_CAPACITY && run === TUBE_CAPACITY) continue;
    const srcSingle = run === src.length;
    let firstEmptyUsed = false;
    for (let to = 0; to < n; to++) {
      if (to === from) continue;
      const dst = st[to];
      if (dst.length === 0) {
        // symmetry breaking: only consider the first empty tube
        if (firstEmptyUsed) continue;
        firstEmptyUsed = true;
        // pouring a single-color tube into an empty tube never helps
        if (srcSingle) continue;
        const mv: Move = { from, to, count: run };
        out.push({ mv, score: 10 + run + (run === src.length ? 20 : 0) });
      } else {
        if (dst[dst.length - 1] !== top) continue;
        const space = TUBE_CAPACITY - dst.length;
        if (space <= 0) continue;
        const count = Math.min(run, space);
        const completes = dst.length + count === TUBE_CAPACITY;
        const srcEmptied = count === src.length;
        let score = count;
        if (dst.length > 0) score += 40;
        if (completes) score += 100;
        if (srcEmptied) score += 20;
        out.push({ mv: { from, to, count }, score });
      }
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

interface SolveResult {
  solution: Move[] | null;
  nodes: number;
}

/**
 * Depth-first solver with memoization and heuristic move ordering.
 * `nodeLimit` guards against pathological states; if it is exhausted the
 * result is null (the caller decides what to do).
 */
export function solve(start: State, nodeLimit = 200000): SolveResult {
  const visited = new Set<string>();
  let nodes = 0;

  const dfs = (st: State): Move[] | null => {
    if (isSolved(st)) return [];
    if (nodes++ >= nodeLimit) return null;
    const key = canonical(st);
    if (visited.has(key)) return null;
    visited.add(key);

    for (const { mv } of genMoves(st)) {
      const rest = dfs(applyMove(st, mv));
      if (rest !== null) return [mv, ...rest];
    }
    return null;
  };

  const solution = dfs(start.map((t) => [...t]));
  return { solution, nodes };
}

/** First move of an optimal-ish solution, used by the in-game Hint. */
export function findHint(st: State): Move | null {
  const { solution } = solve(st, 120000);
  return solution && solution.length > 0 ? solution[0] : null;
}

/**
 * True when no sequence of legal moves can ever reach a solved state.
 * Used to warn the player that they must undo or restart.
 */
export function isDeadState(st: State, nodeLimit = 120000): boolean {
  const { solution } = solve(st, nodeLimit);
  return solution === null;
}
