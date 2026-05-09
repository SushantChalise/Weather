"use client";

import useSWR from "swr";
import type { LuklaFlightStatus, LuklaFlightWindow } from "@/types/weather";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<LuklaFlightWindow>);

const STATUS_CONFIG: Record<
  LuklaFlightStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  open: { label: "Open", color: "text-green-700", bg: "bg-green-50", dot: "bg-green-500" },
  marginal: { label: "Marginal", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" },
  closed: { label: "Closed", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" },
};

const NPT_HOUR_OFFSET = 345; // UTC+5:45 in minutes

function nptHour(isoStr: string): string {
  const d = new Date(isoStr);
  const nptMin = d.getUTCHours() * 60 + d.getUTCMinutes() + NPT_HOUR_OFFSET;
  const h = Math.floor(nptMin / 60) % 24;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}${ampm}`;
}

export function LuklaFlightCard() {
  const { data, isLoading } = useSWR<LuklaFlightWindow>("/api/lukla-window", fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });

  if (isLoading) {
    return (
      <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
        <p className="text-xs text-[var(--color-text-muted)]">Loading Lukla flight window…</p>
      </div>
    );
  }
  if (!data) return null;

  const cfg = STATUS_CONFIG[data.currentStatus];

  return (
    <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
            Lukla Airport · EBC Gateway
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Flight Window
          </span>
        </div>
        <div
          className={[
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold",
            cfg.color,
            cfg.bg,
          ].join(" ")}
        >
          <span className={["w-2 h-2 rounded-full", cfg.dot].join(" ")} />
          {cfg.label}
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)] mb-3">{data.statusReason}</p>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-[var(--color-surface-alt)] rounded p-2">
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Low Cloud</p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {data.cloudLow.toFixed(0)}%
          </p>
        </div>
        <div className="bg-[var(--color-surface-alt)] rounded p-2">
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Wind</p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {data.windKmh.toFixed(0)} km/h
          </p>
        </div>
        <div className="bg-[var(--color-surface-alt)] rounded p-2">
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Visibility</p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {data.visibilityKm.toFixed(0)} km
          </p>
        </div>
      </div>

      {data.morningHours.length > 0 && (
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
            Morning Outlook (NPT)
          </p>
          <div className="flex gap-1 flex-wrap">
            {data.morningHours.map((h) => {
              const hcfg = STATUS_CONFIG[h.status];
              return (
                <span
                  key={h.hour}
                  title={`${nptHour(h.hour)} — Cloud: ${h.cloudLow.toFixed(0)}%, Wind: ${h.windKmh.toFixed(0)} km/h`}
                  className={[
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    hcfg.color,
                    hcfg.bg,
                  ].join(" ")}
                >
                  {nptHour(h.hour)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-[var(--color-text-muted)] mt-3">
        Open-Meteo forecast · Not for operational flight planning
      </p>
    </div>
  );
}
