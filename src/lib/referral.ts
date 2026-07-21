const KEY = "alm_ref_code";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function captureRefFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && ref.trim()) {
      localStorage.setItem(KEY, JSON.stringify({ code: ref.trim(), ts: Date.now() }));
    }
  } catch {}
}

export function getStoredRefCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, ts } = JSON.parse(raw) as { code: string; ts: number };
    if (!code || !ts || Date.now() - ts > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function clearStoredRefCode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
