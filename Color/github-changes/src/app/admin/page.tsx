"use client";

/**
 * Color Manor — Admin panel (/admin)
 * Manage coins per device: look up a device, add coins, set coins,
 * broadcast to everyone, inspect players and grant history.
 * Guarded by the ADMIN_KEY environment variable on the server — set it
 * in the Vercel dashboard (Settings → Environment Variables → ADMIN_KEY),
 * then redeploy. The panel only checks the key against the live API;
 * there is no client-side password.
 */

import { useCallback, useEffect, useState } from "react";
import { getApiBase } from "@/game/api-base";

type Lang = "fa" | "en";

const FA = {
  title: "پنل مدیریت عمارت رنگین",
  sub: "مدیریت سکهٔ بازیکن‌ها بر اساس شناسهٔ دستگاه",
  key_label: "کلید مدیریت",
  device_id: "شناسهٔ دستگاه",
  login: "ورود",
  wrong_key: "کلید اشتباه است",
  net_err: "اتصال به سرور برقرار نشد؛ اینترنت را بررسی کنید و در تنظیمات بازی، لینک سرور (Vercel) را وارد کنید.",
  stats_players: "بازیکن",
  stats_grants: "هدیهٔ ثبت‌شده",
  stats_sum: "مجموع سکهٔ هدیه‌داده‌شده",
  lookup_title: "مدیریت سکهٔ یک دستگاه",
  device_placeholder: "شناسهٔ دستگاه (مثلاً cm-xxxx…)",
  search: "جستجو",
  not_found: "این دستگاه هنوز بازی نکرده یا شناسه اشتباه است؛ با ارسال هدیه برایش ثبت می‌شود.",
  player_name: "نام",
  coins_label: "سکه‌ها",
  stars_label: "ستاره‌ها",
  levels_label: "مرحله‌های کامل‌شده",
  score_label: "امتیاز",
  cur_level: "مرحلهٔ فعلی",
  last_seen: "آخرین حضور",
  add_coins: "افزودن سکه",
  set_coins: "تنظیم سکه",
  amount: "مقدار",
  reason: "دلیل (اختیاری)",
  send: "ثبت هدیه",
  grant_ok: "هدیه ثبت شد و در اولین اتصال بازیکن به کیفش اضافه می‌شود.",
  grant_err_zero: "مقدار نمی‌تواند صفر باشد",
  grant_err_same: "سکه‌ها همین حالا برابر همان مقدارند",
  broadcast_title: "هدیه به همهٔ بازیکن‌ها",
  broadcast_btn: "ارسال به همه",
  broadcast_ok: "هدیه برای همه ثبت شد",
  recent_players: "آخرین بازیکن‌ها (برای مدیریت، روی شناسه بزن)",
  recent_grants: "آخرین هدیه‌ها",
  claimed: "دریافت‌شده",
  pending: "در انتظار دریافت",
  copy: "کپی",
  copied: "کپی شد!",
  logout: "خروج",
  refresh: "به‌روزرسانی",
  empty: "هنوز داده‌ای نیست",
  amount_positive: "مقدار باید بزرگ‌تر از صفر باشد",
  back_game: "بازگشت به بازی",
};

const EN = {
  title: "Color Manor — Admin Panel",
  sub: "Manage player coins by device id",
  key_label: "Admin key",
  device_id: "Device ID",
  login: "Enter",
  wrong_key: "Wrong key",
  net_err: "Could not reach the server — check your connection and set the server (Vercel) URL in the game's settings.",
  stats_players: "Players",
  stats_grants: "Grants issued",
  stats_sum: "Coins gifted (sum)",
  lookup_title: "Manage coins for one device",
  device_placeholder: "Device id (e.g. cm-xxxx…)",
  search: "Look up",
  not_found: "This device has not played yet (or the id is wrong); a gift will register it.",
  player_name: "Name",
  coins_label: "Coins",
  stars_label: "Stars",
  levels_label: "Levels cleared",
  score_label: "Score",
  cur_level: "Current level",
  last_seen: "Last seen",
  add_coins: "Add coins",
  set_coins: "Set coins",
  amount: "Amount",
  reason: "Reason (optional)",
  send: "Issue gift",
  grant_ok: "Gift issued — it lands in the player's wallet on their next sync.",
  grant_err_zero: "Amount cannot be zero",
  grant_err_same: "Coins already equal that amount",
  broadcast_title: "Gift to all players",
  broadcast_btn: "Send to everyone",
  broadcast_ok: "Gift issued for everyone",
  recent_players: "Recent players (tap the id to manage)",
  recent_grants: "Recent grants",
  claimed: "Claimed",
  pending: "Pending",
  copy: "Copy",
  copied: "Copied!",
  logout: "Log out",
  refresh: "Refresh",
  empty: "No data yet",
  amount_positive: "Amount must be greater than zero",
  back_game: "Back to game",
};

interface PlayerRow {
  deviceId: string;
  name: string | null;
  coins: number;
  stars: number;
  levelsCleared: number;
  score: number;
  currentLevel: number;
  updatedAt: string;
}

interface GrantRow {
  id: string;
  deviceId: string;
  playerName: string | null;
  amount: number;
  reason: string;
  claimed: boolean;
  createdAt: string;
}

const card =
  "rounded-3xl border-2 border-amber-100/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(124,58,12,0.12)] backdrop-blur";
const inputCls =
  "min-h-10 w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-3 text-sm font-bold text-stone-800 outline-none focus:border-amber-400";
const btnCls =
  "min-h-10 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 px-4 text-sm font-black text-white shadow-[0_3px_0_#c2410c] transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-50";
const btnGhost =
  "min-h-10 rounded-xl border border-stone-300 bg-white px-4 text-sm font-black text-stone-600 shadow-[0_3px_0_#d6d3d1] transition-all active:translate-y-[2px] active:shadow-none";

export default function AdminPage() {
  const [lang, setLang] = useState<Lang>("fa");
  const T = lang === "fa" ? FA : EN;
  const [key, setKey] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("cm-admin-key") ?? "" : "",
  );
  const [authed, setAuthed] = useState(() =>
    typeof window !== "undefined" ? !!sessionStorage.getItem("cm-admin-key") : false,
  );
  const [keyError, setKeyError] = useState(false);
  const [netError, setNetError] = useState(false);
  // device id currently flashing "کپی شد!" on its copy button
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [overview, setOverview] = useState<{
    totalPlayers: number;
    totalGrants: number;
    grantedSum: number;
    players: PlayerRow[];
  } | null>(null);
  const [grants, setGrants] = useState<GrantRow[]>([]);

  const [lookupId, setLookupId] = useState("");
  const [lookup, setLookup] = useState<{ player: PlayerRow | null; grants: GrantRow[] } | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [bcAmount, setBcAmount] = useState("");
  const [bcReason, setBcReason] = useState("");

  const loadOverview = useCallback(async () => {
    try {
      const [pRes, gRes] = await Promise.all([
        fetch(getApiBase() + "/api/admin/players", { headers: { "x-admin-key": key }, cache: "no-store" }),
        fetch(getApiBase() + "/api/admin/grant", { headers: { "x-admin-key": key }, cache: "no-store" }),
      ]);
      if (pRes.status === 401 || gRes.status === 401) {
        setAuthed(false);
        return;
      }
      const pData = await pRes.json();
      const gData = await gRes.json();
      setOverview(pData);
      setGrants(gData.grants ?? []);
    } catch {
      /* ignore */
    }
  }, [key]);

  const login = async () => {
    setKeyError(false);
    setNetError(false);
    try {
      const res = await fetch(getApiBase() + "/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok === true) {
        sessionStorage.setItem("cm-admin-key", key);
        setAuthed(true);
        loadOverview();
      } else {
        setKeyError(true);
      }
    } catch {
      setNetError(true);
    }
  };

  useEffect(() => {
    if (authed && key) {
      const id = setTimeout(() => loadOverview(), 0);
      return () => clearTimeout(id);
    }
  }, [authed, key, loadOverview]);

  const doLookup = async (id?: string) => {
    const deviceId = (id ?? lookupId).trim();
    if (!deviceId) return;
    setLookupId(deviceId);
    setMsg(null);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/player?deviceId=${encodeURIComponent(deviceId)}`, {
        headers: { "x-admin-key": key },
        cache: "no-store",
      });
      const data = await res.json();
      setLookup(data);
    } catch {
      setLookup(null);
    }
  };

  // copy a device id to the clipboard — clipboard API first, textarea
  // fallback for older WebViews — then flash "کپی شد!" on the button
  const copyDeviceId = async (id: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(id);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = id;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1600);
    } else {
      // last resort: show the full id so it can be noted manually
      setMsg({ kind: "err", text: id });
    }
  };

  const issueGrant = async (mode: "add" | "set") => {
    setMsg(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt === 0) {
      setMsg({ kind: "err", text: T.grant_err_zero });
      return;
    }
    if (mode === "set" && lookup?.player && amt === lookup.player.coins) {
      setMsg({ kind: "err", text: T.grant_err_same });
      return;
    }
    const res = await fetch(getApiBase() + "/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ deviceId: lookupId.trim(), amount: amt, mode, reason }),
    });
    const data = await res.json();
    if (data.ok) {
      setMsg({ kind: "ok", text: T.grant_ok });
      setAmount("");
      setReason("");
      doLookup();
      loadOverview();
    } else {
      setMsg({ kind: "err", text: data.error ?? "error" });
    }
  };

  const broadcast = async () => {
    const amt = Number(bcAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setMsg({ kind: "err", text: T.amount_positive });
      return;
    }
    const res = await fetch(getApiBase() + "/api/admin/grant-all", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ amount: amt, reason: bcReason || "broadcast" }),
    });
    const data = await res.json();
    if (data.ok) {
      setMsg({ kind: "ok", text: `${T.broadcast_ok} (${data.sent})` });
      setBcAmount("");
      loadOverview();
    }
  };

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(lang === "fa" ? "fa-IR" : "en-GB");
    } catch {
      return iso;
    }
  };

  /* ---------------- login gate ---------------- */
  if (!authed) {
    return (
      <div dir={lang === "fa" ? "rtl" : "ltr"} className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-[#FDF3E0] to-[#F5E3C3] p-6">
        <div className={`w-full max-w-sm ${card}`}>
          <div className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-gradient-to-b from-amber-300 to-orange-500 shadow-md">
              <svg viewBox="0 0 24 24" className="size-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="4" y="10" width="16" height="10" rx="2.5" />
                <path d="M8 10V7a4 4 0 118 0v3" />
                <circle cx="12" cy="15" r="1.6" fill="currentColor" />
              </svg>
            </div>
            <h1 className="mt-3 text-xl font-black text-stone-800">{T.title}</h1>
            <p className="mt-1 text-xs font-bold text-stone-500">{T.sub}</p>
          </div>
          <label className="mt-5 block text-sm font-black text-stone-600">{T.key_label}</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            className={`${inputCls} mt-1.5 tracking-widest`}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {keyError && <p className="mt-2 text-xs font-black text-rose-600">{T.wrong_key}</p>}
          {netError && <p className="mt-2 text-xs font-black leading-5 text-rose-600">{T.net_err}</p>}
          <button type="button" onClick={login} className={`${btnCls} mt-4 w-full`}>
            {T.login}
          </button>
          <a
            href="/"
            className={`${btnGhost} mt-2 flex w-full items-center justify-center gap-2 no-underline`}
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 11l9-8 9 8" />
              <path d="M5 10v10h14V10" />
            </svg>
            {T.back_game}
          </a>
          <div className="mt-3 flex justify-center gap-1 rounded-full bg-stone-100 p-1">
            {(["fa", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`min-h-8 rounded-full px-4 text-xs font-black ${
                  lang === l ? "bg-orange-500 text-white" : "text-stone-500"
                }`}
              >
                {l === "fa" ? "فارسی" : "English"}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- dashboard ---------------- */
  return (
    <div dir={lang === "fa" ? "rtl" : "ltr"} className="min-h-dvh bg-gradient-to-b from-[#FDF3E0] to-[#F5E3C3] px-4 pb-16 pt-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 text-2xl shadow">
              🔧
            </div>
            <div>
              <h1 className="text-lg font-black text-stone-800">{T.title}</h1>
              <p className="text-xs font-bold text-stone-500">{T.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-full bg-white/80 p-1 shadow-sm">
              {(["fa", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-8 rounded-full px-3 text-xs font-black ${
                    lang === l ? "bg-orange-500 text-white" : "text-stone-500"
                  }`}
                >
                  {l === "fa" ? "فارسی" : "EN"}
                </button>
              ))}
            </div>
            <button type="button" onClick={loadOverview} className={btnGhost}>
              ⟳ {T.refresh}
            </button>
            <a href="/" className={btnGhost}>
              🏠 {T.back_game}
            </a>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("cm-admin-key");
                setAuthed(false);
                setKey("");
              }}
              className={btnGhost}
            >
              {T.logout}
            </button>
          </div>
        </div>

        {/* stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: T.stats_players, value: overview?.totalPlayers ?? 0, icon: "👤" },
            { label: T.stats_grants, value: overview?.totalGrants ?? 0, icon: "🎁" },
            { label: T.stats_sum, value: overview?.grantedSum ?? 0, icon: "🪙" },
          ].map((s) => (
            <div key={s.label} className={`${card} text-center`}>
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-1 text-2xl font-black text-amber-600 tabular-nums">{s.value}</div>
              <div className="mt-0.5 text-[10px] font-bold leading-4 text-stone-500">{s.label}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div
            className={`mt-3 rounded-2xl border px-4 py-2.5 text-sm font-bold ${
              msg.kind === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-600"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* device lookup + coin management */}
        <div className={`mt-4 ${card}`}>
          <h2 className="text-base font-black text-stone-800">🪙 {T.lookup_title}</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doLookup()}
              dir="ltr"
              className={`${inputCls} flex-1 text-left font-mono`}
              placeholder={T.device_placeholder}
            />
            <button type="button" onClick={() => doLookup()} className={btnCls}>
              {T.search}
            </button>
          </div>

          {lookup && (
            lookup.player ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-black text-stone-800">
                      {lookup.player.name ?? "—"}
                      <span dir="ltr" className="font-mono text-[10px] font-bold text-stone-400">
                        {lookup.player.deviceId}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const p = lookup.player;
                          if (p) void copyDeviceId(p.deviceId);
                        }}
                        aria-label={T.copy}
                        title={copiedId === lookup.player.deviceId ? T.copied : T.copy}
                        className={
                          "flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors " +
                          (copiedId === lookup.player.deviceId
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-white text-stone-400 hover:bg-amber-100 hover:text-amber-700")
                        }
                      >
                        {copiedId === lookup.player.deviceId ? (
                          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M4.5 12.5l5 5 10-11" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <rect x="9" y="9" width="11" height="11" rx="2" />
                            <path d="M5 15V6a2 2 0 012-2h9" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="text-[11px] font-bold text-stone-500">
                      {T.last_seen}: {fmtTime(lookup.player.updatedAt)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
                    {[
                      [T.coins_label, lookup.player.coins, "🪙"],
                      [T.stars_label, lookup.player.stars, "⭐"],
                      [T.levels_label, lookup.player.levelsCleared, "🏁"],
                      [T.score_label, lookup.player.score, "🏆"],
                      [T.cur_level, lookup.player.currentLevel, "📍"],
                    ].map(([label, value, icon]) => (
                      <div key={String(label)} className="rounded-xl bg-white px-2 py-1.5 shadow-sm">
                        <div className="text-xs">{icon}</div>
                        <div className="text-sm font-black text-stone-800 tabular-nums">{Number(value)}</div>
                        <div className="text-[9px] font-bold text-stone-400">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* grant actions */}
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    className={inputCls}
                    placeholder={T.amount}
                  />
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={inputCls}
                    placeholder={T.reason}
                  />
                  <button
                    type="button"
                    onClick={() => issueGrant("add")}
                    disabled={!lookupId.trim()}
                    className={btnCls}
                  >
                    ＋ {T.add_coins}
                  </button>
                  <button
                    type="button"
                    onClick={() => issueGrant("set")}
                    disabled={!lookupId.trim()}
                    className={btnGhost}
                  >
                    = {T.set_coins}
                  </button>
                </div>

                {lookup.grants.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-black text-stone-500">{T.recent_grants}</div>
                    <ul className="mt-1.5 space-y-1">
                      {lookup.grants.map((g) => (
                        <li key={g.id} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-stone-600 shadow-sm">
                          <span className="tabular-nums">
                            {g.amount >= 0 ? "+" : ""}
                            {g.amount} 🪙 {g.reason && <span className="text-stone-400">· {g.reason}</span>}
                          </span>
                          <span className={g.claimed ? "text-emerald-600" : "text-amber-600"}>
                            {g.claimed ? "✓ " + T.claimed : "⏳ " + T.pending}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-500">
                {T.not_found}
              </div>
            )
          )}
        </div>

        {/* broadcast */}
        <div className={`mt-4 ${card}`}>
          <h2 className="text-base font-black text-stone-800">📢 {T.broadcast_title}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={bcAmount}
              onChange={(e) => setBcAmount(e.target.value)}
              type="number"
              className={inputCls}
              placeholder={T.amount}
            />
            <input
              value={bcReason}
              onChange={(e) => setBcReason(e.target.value)}
              className={inputCls}
              placeholder={T.reason}
            />
            <button type="button" onClick={broadcast} className={btnCls}>
              {T.broadcast_btn}
            </button>
          </div>
        </div>

        {/* recent players */}
        <div className={`mt-4 ${card}`}>
          <h2 className="text-base font-black text-stone-800">👥 {T.recent_players}</h2>
          {overview && overview.players.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-black text-stone-400">
                    <th className="p-1.5 text-start">{T.device_id}</th>
                    <th className="p-1.5 text-start">{T.player_name}</th>
                    <th className="p-1.5">🪙</th>
                    <th className="p-1.5">⭐</th>
                    <th className="p-1.5">🏁</th>
                    <th className="p-1.5">🏆</th>
                    <th className="p-1.5">{T.last_seen}</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.players.map((p) => (
                    <tr key={p.deviceId} className="border-t border-stone-100 text-center font-bold text-stone-700">
                      <td className="p-1.5 text-start">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => doLookup(p.deviceId)}
                            dir="ltr"
                            className="rounded-lg bg-amber-50 px-2 py-1 font-mono text-[11px] text-amber-700 hover:bg-amber-100"
                            title={T.search}
                          >
                            {p.deviceId.length > 18 ? p.deviceId.slice(0, 15) + "…" : p.deviceId}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyDeviceId(p.deviceId)}
                            aria-label={T.copy}
                            title={copiedId === p.deviceId ? T.copied : T.copy}
                            className={
                              "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors " +
                              (copiedId === p.deviceId
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-stone-100 text-stone-500 hover:bg-amber-100 hover:text-amber-700")
                            }
                          >
                            {copiedId === p.deviceId ? (
                              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M4.5 12.5l5 5 10-11" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <rect x="9" y="9" width="11" height="11" rx="2" />
                                <path d="M5 15V6a2 2 0 012-2h9" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-1.5 text-start">{p.name ?? "—"}</td>
                      <td className="p-1.5 tabular-nums">{p.coins}</td>
                      <td className="p-1.5 tabular-nums">{p.stars}</td>
                      <td className="p-1.5 tabular-nums">{p.levelsCleared}</td>
                      <td className="p-1.5 tabular-nums">{p.score}</td>
                      <td className="p-1.5 text-[10px] text-stone-400">{fmtTime(p.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-xs font-bold text-stone-400">{T.empty}</p>
          )}
        </div>

        {/* recent grants */}
        <div className={`mt-4 ${card}`}>
          <h2 className="text-base font-black text-stone-800">🎁 {T.recent_grants}</h2>
          {grants.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {grants.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl bg-stone-50 px-3 py-2 text-xs font-bold text-stone-600 shadow-sm"
                >
                  <span className="tabular-nums">
                    <span className={g.amount >= 0 ? "text-emerald-600" : "text-rose-500"}>
                      {g.amount >= 0 ? "+" : ""}
                      {g.amount} 🪙
                    </span>{" "}
                    <span dir="ltr" className="font-mono text-[10px] text-stone-400">
                      {g.deviceId.slice(0, 12)}…
                    </span>
                    {g.playerName && <span className="text-stone-500"> · {g.playerName}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    {g.reason && <span className="text-stone-400">{g.reason}</span>}
                    <span className={g.claimed ? "text-emerald-600" : "text-amber-600"}>
                      {g.claimed ? "✓ " + T.claimed : "⏳ " + T.pending}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs font-bold text-stone-400">{T.empty}</p>
          )}
        </div>
      </div>
    </div>
  );
}
