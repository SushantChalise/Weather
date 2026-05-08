"use client";

import { useState } from "react";
import { formatNPTTimeOnly } from "@/lib/npt/format-npt";
import type { DecisionStripData, DecisionStripPill } from "@/types/weather";

const PILL_COLORS: Record<DecisionStripPill["category"], string> = {
  best_now: "border-l-[var(--color-best)] bg-amber-50",
  best_view: "border-l-[var(--color-sunrise)] bg-orange-50",
  watch: "border-l-[var(--color-watch)] bg-gray-50",
  avoid: "border-l-[var(--color-avoid)] bg-red-50",
};

const PILL_LABEL_COLORS: Record<DecisionStripPill["category"], string> = {
  best_now: "text-amber-700",
  best_view: "text-orange-700",
  watch: "text-gray-600",
  avoid: "text-red-700",
};

type Props = {
  data: DecisionStripData;
};

export function DecisionStrip({ data }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggle = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  return (
    <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-0 lg:gap-0">
        {data.pills.map((pill) => {
          const isExpanded = expandedCategory === pill.category;
          return (
            <button
              key={pill.category}
              type="button"
              onClick={() => toggle(pill.category)}
              aria-label={`${pill.label}: ${pill.items.map((i) => i.name).join(", ")}`}
              aria-expanded={isExpanded}
              className={[
                "flex flex-col text-left px-4 py-2 border-l-4 cursor-pointer transition-colors duration-200",
                "hover:bg-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-best)]",
                "lg:flex-1 border-b lg:border-b-0 lg:border-r border-[var(--color-border-subtle)]",
                PILL_COLORS[pill.category],
              ].join(" ")}
            >
              <span
                className={[
                  "text-xs font-bold uppercase tracking-wider",
                  PILL_LABEL_COLORS[pill.category],
                ].join(" ")}
              >
                {pill.label}
              </span>
              <span className="text-sm font-medium text-[var(--color-text-primary)] mt-0.5">
                {pill.items.map((i) => i.name).join(" · ")}
              </span>
              {isExpanded && (
                <ul className="mt-2 space-y-1">
                  {pill.items.map((item) => (
                    <li
                      key={item.destinationId}
                      className="text-xs text-[var(--color-text-secondary)]"
                    >
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {item.name}:
                      </span>{" "}
                      {item.reason}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
        <div className="hidden lg:flex items-center px-3 text-xs text-[var(--color-text-muted)] font-mono whitespace-nowrap">
          {formatNPTTimeOnly(data.computedAt)}
        </div>
      </div>
    </div>
  );
}
