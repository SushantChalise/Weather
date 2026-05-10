"use client";

import { useEffect, useState } from "react";

const MANIFEST_URL =
  "https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@data-mirror/himawari/latest/manifest.json";
const SESSION_KEY = "himawari_last_manifest";
const FETCH_TIMEOUT_MS = 5_000;
const REFRESH_MS = 2 * 60 * 1000;

export type DataMirrorManifest = {
  frame_time_utc: string;
  commit_sha: string;
  tile_template: string;
  preview: string;
  generated_at: string;
  source: string;
  frame_sha?: string;
  previous_manifest: string | null;
};

export type HimawariState =
  | { status: "ok"; manifest: DataMirrorManifest; staleMins: null }
  | { status: "stale"; manifest: DataMirrorManifest; staleMins: number }
  | { status: "unavailable"; manifest: null; staleMins: null };

async function fetchManifest(): Promise<DataMirrorManifest> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(MANIFEST_URL, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as DataMirrorManifest;
  } finally {
    clearTimeout(timer);
  }
}

function readSessionManifest(): DataMirrorManifest | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DataMirrorManifest;
  } catch {
    return null;
  }
}

function writeSessionManifest(m: DataMirrorManifest) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(m));
  } catch {
    // sessionStorage unavailable — no-op
  }
}

function staleMinsFrom(frameTimeUtc: string): number {
  return Math.floor((Date.now() - new Date(frameTimeUtc).getTime()) / 60_000);
}

export function useHimawari(): HimawariState {
  const [state, setState] = useState<HimawariState>({
    status: "unavailable",
    manifest: null,
    staleMins: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const manifest = await fetchManifest();
        if (cancelled) return;
        writeSessionManifest(manifest);
        setState({ status: "ok", manifest, staleMins: null });
      } catch {
        if (cancelled) return;
        const cached = readSessionManifest();
        if (cached) {
          const staleMins = staleMinsFrom(cached.frame_time_utc);
          setState({ status: "stale", manifest: cached, staleMins });
        } else {
          setState({ status: "unavailable", manifest: null, staleMins: null });
        }
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
