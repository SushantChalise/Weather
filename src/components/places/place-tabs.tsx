"use client";

import { useState } from "react";
import type { DestinationId } from "@/types/weather";
import { AreaChangeTab } from "./tabs/area-change-tab";
import { FutureTab } from "./tabs/future-tab";
import { Last30YearsTab } from "./tabs/last-30-years-tab";
import { MassBalanceTab } from "./tabs/mass-balance-tab";
import { NowTab } from "./tabs/now-tab";
import { NowVsNormalTab } from "./tabs/now-vs-normal-tab";

type DefaultTab = "now" | "now-vs-normal" | "last-30-years" | "future";
type GlacierTab = "now" | "mass-balance" | "area-change" | "future";

const DEFAULT_TABS: { id: DefaultTab; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "now-vs-normal", label: "Now vs Normal" },
  { id: "last-30-years", label: "Last 30 Years" },
  { id: "future", label: "Future" },
];

const GLACIER_TABS: { id: GlacierTab; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "mass-balance", label: "Mass Balance" },
  { id: "area-change", label: "Area Change" },
  { id: "future", label: "Future" },
];

type PlaceTabsProps = {
  destinationId: DestinationId | null;
  lat: number;
  lon: number;
  variant?: "default" | "glacier";
};

export function PlaceTabs({ destinationId, lat, lon, variant = "default" }: PlaceTabsProps) {
  const [activeDefaultTab, setActiveDefaultTab] = useState<DefaultTab>("now");
  const [activeGlacierTab, setActiveGlacierTab] = useState<GlacierTab>("now");

  if (variant === "glacier") {
    return (
      <div>
        {/* Tab bar — horizontal scroll on mobile */}
        <div className="overflow-x-auto border-b border-neutral-200">
          <div className="flex min-w-max px-4">
            {GLACIER_TABS.map((tab) => {
              const isActive = activeGlacierTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveGlacierTab(tab.id)}
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
        {activeGlacierTab === "now" && destinationId !== null && (
          <NowTab destinationId={destinationId} lat={lat} lon={lon} />
        )}
        {activeGlacierTab === "now" && destinationId === null && (
          <div className="px-4 py-6">
            <p className="text-sm text-neutral-500">No current weather data for this location.</p>
          </div>
        )}
        {activeGlacierTab === "mass-balance" && <MassBalanceTab />}
        {activeGlacierTab === "area-change" && <AreaChangeTab />}
        {activeGlacierTab === "future" && <FutureTab />}
      </div>
    );
  }

  return (
    <div>
      {/* Tab bar — horizontal scroll on mobile */}
      <div className="overflow-x-auto border-b border-neutral-200">
        <div className="flex min-w-max px-4">
          {DEFAULT_TABS.map((tab) => {
            const isActive = activeDefaultTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDefaultTab(tab.id)}
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
      {activeDefaultTab === "now" && destinationId !== null && (
        <NowTab destinationId={destinationId} lat={lat} lon={lon} />
      )}
      {activeDefaultTab === "now" && destinationId === null && (
        <div className="px-4 py-6">
          <p className="text-sm text-neutral-500">No current weather data for this location.</p>
        </div>
      )}
      {activeDefaultTab === "now-vs-normal" && <NowVsNormalTab />}
      {activeDefaultTab === "last-30-years" && <Last30YearsTab />}
      {activeDefaultTab === "future" && <FutureTab />}
    </div>
  );
}
