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
  const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
  // Add NPT offset to UTC; toISOString() is always UTC, so replace Z with the real offset.
  return new Date(Date.now() + NPT_OFFSET_MS).toISOString().replace("Z", "+05:45");
}
