"use client";

type AnomalyBadgeProps = {
  delta: number | undefined;
  unit?: string;
  period?: string;
  compact?: boolean;
};

function arrowIcon(delta: number): string {
  if (delta > 0.5) return "↑";
  if (delta < -0.5) return "↓";
  return "→";
}

function deltaColor(delta: number): string {
  if (delta > 0.5) return "text-[#C45B4A]";
  if (delta < -0.5) return "text-blue-500";
  return "text-gray-500";
}

function formatDelta(delta: number, unit: string): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}${unit}`;
}

export function AnomalyBadge({
  delta,
  unit = "°C",
  period = "30-yr avg",
  compact = false,
}: AnomalyBadgeProps) {
  if (delta === undefined) return null;

  const arrow = arrowIcon(delta);
  const color = deltaColor(delta);
  const formattedDelta = formatDelta(delta, unit);

  const label = compact
    ? `${arrow}${formattedDelta}`
    : `${arrow} ${formattedDelta} above ${period}`;

  const title = `${formattedDelta} vs ${period}`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[12px] leading-none ${color}`}
      title={title}
      role="img"
      aria-label={title}
    >
      {label}
    </span>
  );
}
