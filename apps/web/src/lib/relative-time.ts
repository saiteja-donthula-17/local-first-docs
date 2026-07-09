const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "2 hours ago", "just now", etc. from an ISO timestamp. */
export function relativeTime(iso: string): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  for (const [unit, secs] of UNITS) {
    if (abs >= secs || unit === "second") {
      return rtf.format(Math.round(diffSeconds / secs), unit);
    }
  }
  return "just now";
}
