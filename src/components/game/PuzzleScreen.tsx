"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useGame } from "@/game/store";
import { getLevel, TOTAL_LEVELS } from "@/game/levels";
import {
  applyMove,
  isSolved,
  isTubeComplete,
  validateMove,
  findHint,
  type State,
} from "@/game/solver";
import { ECONOMY, starsForMoves } from "@/game/decor";
import { sfx } from "@/game/audio";
import { levelTip } from "@/game/i18n";
import { TubeBoardDOM } from "./Tube";
import { Tubes3D } from "./Tubes3D";
import { hasWebGL } from "@/game/three-kit";
import type { TubeBoardApi } from "@/game/board-anim";
import { Modal, Confetti } from "./Modal";
import { Backdrop } from "./Backdrop";
import {
  BackButton,
  CoinBadge,
  GameButton,
  StarIcon,
  useT,
} from "./UiBits";
import { toast } from "./toast";
import { syncNow } from "@/game/net";

export function PuzzleScreen() {
  const { t, n, lang } = useT();
  const levelId = useGame((s) => s.activeLevel);
  const guideEnabled = useGame((s) => s.guideEnabled);
  const coins = useGame((s) => s.coins);
  const finishLevel = useGame((s) => s.finishLevel);
  const spendHint = useGame((s) => s.spendHint);
  const playLevel = useGame((s) => s.playLevel);
  const goLevels = useGame((s) => s.goLevels);
  const goManor = useGame((s) => s.goManor);
  const goMenu = useGame((s) => s.goMenu);

  const data = useMemo(() => getLevel(levelId), [levelId]);
  const initial = useMemo<State>(() => data.tubes.map((x) => [...x]), [data]);
  const use3D = useMemo(() => hasWebGL(), []);

  const [tubes, setTubes] = useState<State>(() => initial.map((x) => [...x]));
  const [history, setHistory] = useState<State[]>([]);
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [justCompleted, setJustCompleted] = useState<number[]>([]);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const [hinted, setHinted] = useState<{ from: number; to: number } | null>(null);
  const [won, setWon] = useState(false);
  const [result, setResult] = useState<{ stars: 1 | 2 | 3; coins: number; firstClear: boolean } | null>(null);
  const [showGuide, setShowGuide] = useState(guideEnabled);
  const [deadEnd, setDeadEnd] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const boardRef = useRef<TubeBoardApi | null>(null);
  const busyRef = useRef(false);

  const resetLevel = useCallback(() => {
    setTubes(initial.map((x) => [...x]));
    setHistory([]);
    setMoves(0);
    setSelected(null);
    setJustCompleted([]);
    setHinted(null);
    setWon(false);
    setResult(null);
    setDeadEnd(false);
    busyRef.current = false;
    setBusy(false);
  }, [initial]);

  const finish = useCallback(
    (finalState: State, finalMoves: number) => {
      const stars = starsForMoves(finalMoves, data.par);
      const res = finishLevel(levelId, finalMoves, stars);
      setResult({ stars, coins: res.coins, firstClear: res.firstClear });
      setWon(true);
      sfx.win();
      // report progress to the leaderboard (fire-and-forget, offline safe)
      syncNow(true);
    },
    [data.par, finishLevel, levelId],
  );

  const handleTap = useCallback(
    (i: number) => {
      if (busyRef.current || won) return;
      if (selected === null) {
        if (tubes[i].length === 0) {
          sfx.error();
          setShakeIdx(i);
          setTimeout(() => setShakeIdx(null), 400);
          return;
        }
        setSelected(i);
        sfx.select();
        return;
      }
      if (selected === i) {
        setSelected(null);
        return;
      }
      const count = validateMove(tubes, selected, i);
      if (count === null) {
        sfx.error();
        setShakeIdx(i);
        setTimeout(() => setShakeIdx(null), 400);
        toast(t("invalid_move"), "error");
        return;
      }
      // ---- valid pour (3D board animates; state lands after it resolves) ----
      busyRef.current = true;
      setBusy(true);
      const from = selected;
      setSelected(null);
      const color = tubes[from][tubes[from].length - 1];
      const newState = applyMove(tubes, { from, to: i, count });
      sfx.pour(count);

      const anim: Promise<void> = boardRef.current
        ? boardRef.current.pour(from, i, count, color)
        : Promise.resolve();
      anim.then(() => {
        const prevComplete = tubes.map(isTubeComplete);
        const nextComplete = newState.map(isTubeComplete);
        const newly = nextComplete
          .map((c, idx) => (c && !prevComplete[idx] ? idx : -1))
          .filter((x) => x >= 0);
        setHistory((h) => [...h, tubes.map((x) => [...x])]);
        setTubes(newState);
        setMoves((m) => m + 1);
        busyRef.current = false;
        setBusy(false);
        if (newly.length > 0) {
          setJustCompleted(newly);
          sfx.tubeComplete();
          setTimeout(() => setJustCompleted([]), 1200);
        }
        if (isSolved(newState)) {
          setTimeout(() => finish(newState, moves + 1), newly.length > 0 ? 700 : 250);
        }
      });
    },
    [finish, moves, selected, t, tubes, won],
  );

  const onUndo = useCallback(() => {
    if (busyRef.current || won) return;
    if (history.length === 0) {
      sfx.error();
      return;
    }
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setTubes(prev);
    setMoves((m) => Math.max(0, m - 1));
    setSelected(null);
    sfx.undo();
  }, [history, won]);

  const onHint = useCallback(() => {
    if (busyRef.current || won) return;
    const cost = levelId <= 5 ? 0 : ECONOMY.hintCost;
    if (cost > 0) {
      const ok = spendHint();
      if (!ok) {
        sfx.error();
        toast(t("hint_no_coins"), "error");
        return;
      }
      sfx.coin();
      toast(t("hint_cost_toast"), "info");
    }
    const mv = findHint(tubes);
    if (!mv) {
      setDeadEnd(true);
      return;
    }
    setHinted({ from: mv.from, to: mv.to });
    setTimeout(() => setHinted(null), 2800);
  }, [levelId, spendHint, t, tubes, won]);

  return (
    <div className="scene-root flex min-h-dvh flex-col">
      <Backdrop />
      {/* header */}
      <header className="flex items-center justify-between gap-2 px-3 pt-3">
        <div className="flex items-center gap-2">
          <BackButton onClick={goLevels} label={t("back")} />
          <div className="rounded-2xl border border-white/70 bg-white/85 px-3 py-1.5 text-sm font-bold text-stone-700 shadow-[0_3px_10px_rgba(120,80,30,0.15)] backdrop-blur">
            {t("level")} {n(levelId)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-white/70 bg-white/85 px-3 py-1.5 text-sm font-bold text-stone-700 shadow-[0_3px_10px_rgba(120,80,30,0.15)] backdrop-blur">
            <span className="opacity-70">{t("moves_label")}: </span>
            <span className="tabular-nums">{n(moves)}</span>
          </div>
          <CoinBadge value={coins} />
        </div>
      </header>

      {/* board (WebGL 3D, with DOM fallback when WebGL is unavailable) */}
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-3 py-3">
        {use3D ? (
          <Tubes3D
            ref={boardRef}
            tubes={tubes}
            selected={selected}
            hinted={hinted}
            justCompleted={justCompleted}
            shakeIdx={shakeIdx}
            onTap={handleTap}
            className="h-[56vh] max-h-[660px] min-h-[300px] w-full max-w-xl"
          />
        ) : (
          <TubeBoardDOM
            ref={boardRef}
            tubes={tubes}
            selected={selected}
            hinted={hinted}
            justCompleted={justCompleted}
            shakeIdx={shakeIdx}
            onTap={handleTap}
          />
        )}
      </main>

      {/* bottom bar */}
      <footer className="flex items-center justify-center gap-3 px-4 pb-6 pt-2">
        <GameButton variant="ghost" onClick={onUndo} className="min-w-24 flex-1 max-w-32">
          <span className="flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 14L4 9l5-5" />
              <path d="M4 9h10a6 6 0 016 6v1" />
            </svg>
            {t("undo")}
          </span>
        </GameButton>
        <GameButton variant="gold" onClick={onHint} className="min-w-24 flex-1 max-w-32">
          <span className="flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
            </svg>
            {t("hint")}
          </span>
        </GameButton>
        <GameButton variant="secondary" onClick={() => setConfirmRestart(true)} className="min-w-24 flex-1 max-w-32">
          <span className="flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 12a9 9 0 109-9" />
              <path d="M3 4v5h5" />
            </svg>
            {t("restart")}
          </span>
        </GameButton>
      </footer>

      {/* guide */}
      <Modal
        open={showGuide}
        closable={levelId > 3}
        onClose={() => setShowGuide(false)}
        ariaLabel={t("guide_title")}
      >
        <div className="text-center">
          <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 text-xl font-black text-white shadow-md">
            {n(levelId)}
          </div>
          <h2 className="text-xl font-black text-stone-800">
            {t("guide_title")} {n(levelId)}
          </h2>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-sm font-black text-emerald-700">{t("guide_goal")}</div>
            <p className="mt-1 text-sm leading-6 text-stone-700">{t("guide_goal_text")}</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
            <div className="text-sm font-black text-sky-700">{t("guide_tip")}</div>
            <p className="mt-1 text-sm leading-6 text-stone-700">{levelTip(lang, levelId)}</p>
          </div>
        </div>
        <GameButton className="mt-5 w-full" onClick={() => setShowGuide(false)}>
          {t("start_level")}
        </GameButton>
      </Modal>

      {/* win */}
      {won && result && <Confetti />}
      <Modal open={won && result !== null} closable={false} ariaLabel={t("win_title")}>
        <div className="relative text-center">
          {/* trophy with rays */}
          <div className="relative mx-auto -mt-10 mb-1 flex size-24 items-center justify-center">
            <div className="win-rays absolute inset-0" aria-hidden />
            <div className="relative flex size-[74px] items-center justify-center rounded-full border-4 border-white/70 bg-gradient-to-b from-amber-300 to-orange-500 shadow-[0_10px_24px_rgba(234,88,12,0.45),inset_0_2px_8px_rgba(255,255,255,0.6)]">
              <svg viewBox="0 0 24 24" className="size-10 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7 4h10v4.5a5 5 0 01-10 0V4z" fill="currentColor" stroke="none" />
                <path d="M7 5.5H4.6a2.6 2.6 0 002.9 3.9M17 5.5h2.4a2.6 2.6 0 01-2.9 3.9" />
                <path d="M12 13.5v2.5" />
                <path d="M9 16h6l1 4H8l1-4z" fill="currentColor" stroke="none" />
              </svg>
            </div>
          </div>
          <h2 className="title3d text-3xl font-black">{t("win_title")}</h2>
          <p className="mt-1 text-sm font-bold text-stone-500">{t("win_subtitle")}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={cn("star-pop", result && s <= result.stars ? "" : "opacity-40")}
                style={{ animationDelay: `${s * 180}ms` }}
              >
                <StarIcon className="size-12" filled={!!result && s <= result.stars} />
              </span>
            ))}
          </div>
          <div className="coin-pop mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-4 py-1.5 text-lg font-black text-amber-800 shadow-sm">
            +{n(result?.coins ?? 0)}
            <span className="text-sm font-bold text-stone-500">{t("coins_earned")}</span>
          </div>
          {result?.firstClear && (
            <div className="mt-1.5 text-xs font-bold text-emerald-600">
              {t("stars_earned")}: {n(result.stars)}
            </div>
          )}
          <div className="mt-5 grid grid-cols-1 gap-2.5">
            {levelId < TOTAL_LEVELS ? (
              <GameButton className="w-full text-lg" onClick={() => playLevel(levelId + 1)}>
                {t("next_level")} →
              </GameButton>
            ) : (
              <GameButton className="w-full text-lg" variant="gold" onClick={goManor}>
                {t("go_manor")}
              </GameButton>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <GameButton
                variant="ghost"
                className="w-full"
                onClick={() => {
                  resetLevel();
                }}
              >
                {t("replay")}
              </GameButton>
              <GameButton variant="secondary" className="w-full" onClick={goManor}>
                {t("go_manor")}
              </GameButton>
            </div>
            <button type="button" className="mt-1 text-sm font-bold text-stone-500 underline underline-offset-4" onClick={goMenu}>
              {t("to_menu")}
            </button>
          </div>
        </div>
      </Modal>

      {/* dead end */}
      <Modal open={deadEnd} onClose={() => setDeadEnd(false)} ariaLabel={t("hint_dead")}>
        <div className="text-center">
          <h2 className="text-xl font-black text-rose-600">{t("invalid_move")}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">{t("hint_dead")}</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <GameButton variant="ghost" onClick={() => setDeadEnd(false)}>
              {t("undo")}
            </GameButton>
            <GameButton
              variant="danger"
              onClick={() => {
                setDeadEnd(false);
                resetLevel();
              }}
            >
              {t("restart")}
            </GameButton>
          </div>
        </div>
      </Modal>

      {/* restart confirm */}
      <Modal open={confirmRestart} onClose={() => setConfirmRestart(false)} ariaLabel={t("restart_confirm_title")}>
        <div className="text-center">
          <h2 className="text-xl font-black text-stone-800">{t("restart_confirm_title")}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{t("restart_confirm_body")}</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <GameButton variant="ghost" onClick={() => setConfirmRestart(false)}>
              {t("cancel")}
            </GameButton>
            <GameButton
              variant="danger"
              onClick={() => {
                setConfirmRestart(false);
                resetLevel();
              }}
            >
              {t("confirm")}
            </GameButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
