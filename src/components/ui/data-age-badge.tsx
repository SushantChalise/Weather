"use client";

type Props = {
  timestamp: string; // ISO string
  className?: string;
};

function ageMinutes(timestamp: string): number {
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000);
}

function ageColor(minutes: number): string {
  if (minutes < 10) return "text-green-600";
  if (minutes < 30) return "text-amber-600";
  return "text-red-500";
}

function ageLabel(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return `${h}h ago`;
}

export function DataAgeBadge({ timestamp, className = "" }: Props) {
  const minutes = ageMinutes(timestamp);
  return (
    <span
      className={`text-xs tabular-nums ${ageColor(minutes)} ${className}`}
      title={`Data from ${timestamp.replace("T", " ").slice(0, 16)} UTC`}
      suppressHydrationWarning
    >
      {ageLabel(minutes)}
    </span>
  );
}
