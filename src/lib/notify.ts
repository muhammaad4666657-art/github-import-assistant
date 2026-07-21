// Lightweight beep + browser Notification helper (no asset needed).
let ctx: AudioContext | null = null;

export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.35);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.4);
    });
  } catch { /* ignore */ }
}

export async function ensureNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try { new Notification(title, { body, icon: "/favicon.ico", tag: title }); } catch { /* ignore */ }
}
