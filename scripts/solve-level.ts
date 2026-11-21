/**
 * Test helper: compute a full solution for a level with the game's own solver.
 * Usage: bun scripts/solve-level.ts <levelId>
 */
import { getLevel } from "../src/game/levels";
import { solve, type State } from "../src/game/solver";

const id = Number(process.argv[2] ?? 1);
const level = getLevel(id);
const start: State = level.tubes.map((x) => [...x]);
const { solution } = solve(start);
if (!solution) {
  console.error(JSON.stringify({ ok: false, level: id }));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, level: id, moves: solution }));
