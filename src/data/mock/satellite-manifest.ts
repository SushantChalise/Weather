import type { SatelliteEpoch, SatelliteManifest, SatelliteScope } from "@/types/weather";

// Deterministic LCG — same seed always returns same float 0..1
function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) / 4294967296;
}

// Cloud cover varies by hour-of-day: clear mornings, build-up afternoon, clear again at night
function baseCloudByHour(hourUTC: number): number {
  // NPT = UTC + 5:45, so 0 UTC ≈ 5:45 NPT
  const nptHour = (hourUTC + 5.75) % 24;
  if (nptHour < 6) return 15 + nptHour * 2; // pre-dawn: 15–27%
  if (nptHour < 10) return 20 + (nptHour - 6) * 3; // morning: 20–32%
  if (nptHour < 14) return 32 + (nptHour - 10) * 8; // build-up: 32–64%
  if (nptHour < 18) return 64 + (nptHour - 14) * 4; // afternoon: 64–80%
  if (nptHour < 21) return 80 - (nptHour - 18) * 10; // evening clear: 80–50%
  return 50 - (nptHour - 21) * 5; // night: 50–35%
}

function makeEpoch(capturedAtMs: number, scope: SatelliteScope, index: number): SatelliteEpoch {
  const capturedAt = new Date(capturedAtMs);
  const hourUTC = capturedAt.getUTCHours();
  const basePct = baseCloudByHour(hourUTC);
  // Add deterministic noise ±12% per scope+day combination
  const seed = index * 31 + scope.charCodeAt(0);
  const noise = (lcg(seed) - 0.5) * 24;
  const cloudCoverPct = Math.min(100, Math.max(0, Math.round(basePct + noise)));

  // Deterministic hash: simulate SHA-256 prefix from index + scope
  const hashSeed = index * 7919 + scope.length * 31337;
  const hash = Array.from({ length: 16 }, (_, i) =>
    Math.floor(lcg(hashSeed + i) * 256)
      .toString(16)
      .padStart(2, "0"),
  ).join("");

  return {
    capturedAt: capturedAt.toISOString(),
    processedAt: new Date(capturedAtMs + 8 * 60000).toISOString(), // 8 min processing lag
    scope,
    cloudCoverPct,
    hash,
    thumbUrl: null, // populated when offline Himawari pipeline runs
  };
}

const SCOPES: SatelliteScope[] = ["annapurna", "khumbu", "kathmandu_valley", "chitwan", "full"];

export function generateMockSatelliteManifest(): SatelliteManifest {
  const now = Date.now();
  // Latest capture is at the most recent 30-min boundary (Himawari-9 cadence)
  const latestCaptureMs = now - (now % (30 * 60000));
  const ageMinutes = Math.round((now - latestCaptureMs) / 60000);

  // 72h archive at 2h intervals = 36 epochs per scope (use "full" for archive)
  const archive72h: SatelliteEpoch[] = [];
  for (let i = 35; i >= 0; i--) {
    const ms = latestCaptureMs - i * 2 * 3600000;
    archive72h.push(makeEpoch(ms, "full", i));
  }

  // Best/worst in archive
  const sorted = [...archive72h].sort((a, b) => a.cloudCoverPct - b.cloudCoverPct);
  const bestSnapshot = sorted[0] ?? null;
  const worstSnapshot = sorted[sorted.length - 1] ?? null;

  // Current scopes
  const scopes: Partial<Record<SatelliteScope, SatelliteEpoch>> = {};
  SCOPES.forEach((scope, idx) => {
    scopes[scope] = makeEpoch(latestCaptureMs, scope, idx + 100);
  });

  return {
    generatedAt: new Date(latestCaptureMs + 10 * 60000).toISOString(),
    latestCaptureAt: new Date(latestCaptureMs).toISOString(),
    ageMinutes,
    isStale: ageMinutes > 45,
    scopes,
    archive72h,
    bestSnapshot,
    worstSnapshot,
    source: "mock",
  };
}
