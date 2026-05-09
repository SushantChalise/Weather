"use client";

import { useState } from "react";
import type { DestinationId } from "@/types/weather";
import { NowTab } from "./tabs/now-tab";
import { NowVsNormalTab } from "./tabs/now-vs-normal-tab";
import { Last30YearsTab } from "./tabs/last-30-years-tab";
import { FutureTab } from "./tabs/future-tab";

type Tab = "now" | "now-vs-normal" | "last-30-years" | "future";

const TABS: { id: Tab; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "now-vs-normal", label: "Now vs Normal" },
  { id: "last-30-years", label: "Last 30 Years" },
  { id: "future", label: "Future" },
];

type PlaceTabsProps = {
  destinationId: DestinationId;
  lat: number;
  lon: number;
};

export function PlaceTabs({ destinationId, lat, lon }: PlaceTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("now");

  return (
    <div>
      {/* Tab bar — horizontal scroll on mobile */}
      <div className="overflow-x-auto border-b border-neutral-200">
        <div className="flex min-w-max px-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "relative px-3 py-3 text-sm whitespace-nowrap transition-colors",
                  isActive
                    ? "text-neutral-900 font-medium"
                    : "text-neutral-500 hover:text-neutral-700",
                ].join(" ")}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab panels */}
      {activeTab === "now" && (
        <NowTab destinationId={destinationId} lat={lat} lon={lon} />
      )}
      {activeTab === "now-vs-normal" && <NowVsNormalTab />}
      {activeTab === "last-30-years" && <Last30YearsTab />}
      {activeTab === "future" && <FutureTab />}
    </div>
  );
}
