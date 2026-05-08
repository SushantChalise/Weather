import { nowNPTIso } from "@/lib/npt/format-npt";
import type { DecisionStripData } from "@/types/weather";

export const MOCK_DECISION_STRIP: DecisionStripData = {
  pills: [
    {
      category: "best_now",
      label: "BEST NOW",
      items: [
        {
          destinationId: "jomsom",
          name: "Jomsom",
          reason: "Rain-shadow clear · Annapurna views from north",
        },
        { destinationId: "chitwan", name: "Chitwan", reason: "Clear skies, 28°C" },
      ],
    },
    {
      category: "best_view",
      label: "BEST VIEW",
      items: [
        { destinationId: "ebc", name: "EBC AM", reason: "Clear sunrise window 5:30–8 AM" },
        {
          destinationId: "poon-hill",
          name: "Poon Hill AM",
          reason: "Best visibility before 9 AM",
        },
      ],
    },
    {
      category: "watch",
      label: "WATCH",
      items: [
        {
          destinationId: "abc",
          name: "ABC lower trail PM",
          reason: "Rain expected after noon",
        },
        { destinationId: "langtang", name: "Snow above 4,200m", reason: "Snowfall overnight" },
      ],
    },
  ],
  computedAt: nowNPTIso(),
};
