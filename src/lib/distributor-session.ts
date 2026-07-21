const KEY = "alm_distributor_session";

export interface DistributorSession {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export function setDistributorSession(s: DistributorSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("alm-distributor-session-change"));
}

export function updateDistributorSession(patch: Partial<DistributorSession>) {
  const cur = getDistributorSession();
  if (!cur) return;
  setDistributorSession({ ...cur, ...patch });
}

export function getDistributorSession(): DistributorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DistributorSession) : null;
  } catch {
    return null;
  }
}

export function clearDistributorSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("alm-distributor-session-change"));
}

// Password kept only in-memory (session) for profile-update RPC auth.
// Never persisted to disk.
let _pw: string | null = null;
export function setDistributorPassword(p: string) {
  _pw = p;
  if (typeof sessionStorage !== "undefined") {
    try { sessionStorage.setItem("alm_dpw", p); } catch {}
  }
}
export function getDistributorPassword(): string | null {
  if (_pw) return _pw;
  if (typeof sessionStorage !== "undefined") {
    try { return sessionStorage.getItem("alm_dpw"); } catch {}
  }
  return null;
}
export function clearDistributorPassword() {
  _pw = null;
  if (typeof sessionStorage !== "undefined") {
    try { sessionStorage.removeItem("alm_dpw"); } catch {}
  }
}
