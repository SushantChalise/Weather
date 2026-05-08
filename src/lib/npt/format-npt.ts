const NPT_LOCALE = "en-GB";
const NPT_TIMEZONE = "Asia/Kathmandu";

export function formatNPT(iso: string): string {
  return `${new Date(iso).toLocaleString(NPT_LOCALE, {
    timeZone: NPT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  })} NPT`;
}

export function formatNPTTimeOnly(iso: string): string {
  return `${new Date(iso).toLocaleString(NPT_LOCALE, {
    timeZone: NPT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  })} NPT`;
}

export function nowNPTIso(): string {
  const now = new Date();
  // NPT is UTC+5:45
  const offsetMs = (5 * 60 + 45) * 60 * 1000;
  const nptMs = now.getTime() + offsetMs - now.getTimezoneOffset() * 60 * 1000;
  const nptDate = new Date(nptMs);
  return nptDate.toISOString().replace("Z", "+05:45");
}
