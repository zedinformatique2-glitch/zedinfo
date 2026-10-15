// Formats the time left on a landing-page countdown. Returns null once the
// deadline has passed so the page can hide the timer instead of showing a
// frozen 00:00:00. Above a day, days are split out ("3j 00:14:03").
export function formatCountdown(msLeft: number, dayLabel: string): string | null {
  if (msLeft <= 0) return null;
  const total = Math.floor(msLeft / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return d > 0 ? `${d}${dayLabel} ${clock}` : clock;
}
