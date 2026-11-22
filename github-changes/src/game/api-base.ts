/**
 * Base URL for the online-services API (leaderboard, admin, referral).
 *
 * - Web deploy (Vercel): empty string → same-origin relative calls.
 * - Android APK build: NEXT_PUBLIC_API_BASE is baked at build time
 *   (scripts/build-apk.sh, env API_BASE=…), because the APK serves the
 *   game from its local appassets origin.
 * - Runtime override (v1.1.3): the Settings screen can save the server
 *   URL (localStorage key cm-api-base) so a deployed APK never needs a
 *   rebuild when the Vercel domain changes. Only https:// hosts are
 *   accepted; an empty override falls back to the baked value.
 */
const BAKED: string = (
  process.env.NEXT_PUBLIC_API_BASE as string | undefined ?? ""
).replace(/\/+$/, "");

const LS_KEY = "cm-api-base";

/** Effective API base: the saved override wins over the baked value. */
export function getApiBase(): string {
  if (typeof window === "undefined") return BAKED;
  try {
    const v = (localStorage.getItem(LS_KEY) ?? "").trim();
    if (v) {
      const m = v.match(/^https:\/\/[a-z0-9.-]+(?::\d+)?/i);
      if (m) return m[0];
    }
  } catch {
    /* private browsing etc. — fall through */
  }
  return BAKED;
}

/** Save (or clear, with "") the runtime server-URL override. */
export function setApiBase(url: string): void {
  try {
    const t = url.trim().replace(/\/+$/, "");
    if (t) localStorage.setItem(LS_KEY, t);
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

/** The URL baked at build time — shown as the Settings placeholder. */
export function getBakedApiBase(): string {
  return BAKED;
}
