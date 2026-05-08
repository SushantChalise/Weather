import { nowNPTIso } from "@/lib/npt/format-npt";
import type { ComparisonDrawerData } from "@/types/weather";

export const MOCK_COMPARISON_DATA: ComparisonDrawerData = {
  computedAt: nowNPTIso(),
  groups: [
    {
      tripIntent: "mountain_views",
      label: "Mountain Views",
      rows: [
        {
          destinationId: "jomsom",
          name: "Jomsom",
          now: "Clear ☀",
          tomorrowAM: "Clear ☀",
          viewQuality: "High",
          recommendation: "best",
        },
        {
          destinationId: "poon-hill",
          name: "Poon Hill",
          now: "Mostly clear 🌤",
          tomorrowAM: "Best before 9 AM",
          viewQuality: "High",
          recommendation: "best",
        },
        {
          destinationId: "ebc",
          name: "EBC viewpoints",
          now: "Partial 🌤",
          tomorrowAM: "Good AM",
          viewQuality: "Medium",
          recommendation: "good",
        },
        {
          destinationId: "pokhara",
          name: "Pokhara / Sarangkot",
          now: "Cloudy 🌧",
          tomorrowAM: "Improving",
          viewQuality: "Low",
          recommendation: "watch",
        },
        {
          destinationId: "abc",
          name: "ABC",
          now: "Cloudy 🌧",
          tomorrowAM: "Better AM",
          viewQuality: "Low",
          recommendation: "watch",
        },
      ],
    },
    {
      tripIntent: "trekking",
      label: "Trekking Routes",
      rows: [
        {
          destinationId: "ebc",
          name: "EBC",
          now: "Partial 🌤",
          tomorrowAM: "Good",
          trailCondition: "Dry",
          snowConcern: "Above Lobuche",
          recommendation: "good",
        },
        {
          destinationId: "abc",
          name: "ABC",
          now: "Cloudy 🌧",
          tomorrowAM: "Better AM",
          trailCondition: "Wet lower route",
          snowConcern: "Above MBC",
          recommendation: "watch",
        },
        {
          destinationId: "langtang",
          name: "Langtang",
          now: "Cloud ☁",
          tomorrowAM: "Cloudy",
          trailCondition: "Damp",
          snowConcern: "None",
          recommendation: "watch",
        },
      ],
    },
    {
      tripIntent: "lowland",
      label: "Lowland / Non-Mountain",
      rows: [
        {
          destinationId: "chitwan",
          name: "Chitwan",
          now: "Clear ☀",
          tomorrowAM: "Clear ☀",
          recommendation: "best",
        },
        {
          destinationId: "kathmandu",
          name: "Kathmandu",
          now: "Cloud ☁",
          tomorrowAM: "Clearing",
          recommendation: "watch",
        },
      ],
    },
  ],
};
