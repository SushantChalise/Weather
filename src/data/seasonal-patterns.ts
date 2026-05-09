import type { SeasonalPattern } from "@/types/weather";

// Nepal mountain weather seasonal patterns — based on monsoon climatology
export const SEASONAL_PATTERNS: SeasonalPattern[] = [
  {
    month: 1,
    season: "winter",
    seasonLabel: "Winter",
    morningClearChancePct: 75,
    afternoonRainChancePct: 10,
    typicalClearHour: "all day",
    flightRiskNote: "Low cloud risk but cold; possible high-altitude snow",
  },
  {
    month: 2,
    season: "winter",
    seasonLabel: "Winter",
    morningClearChancePct: 70,
    afternoonRainChancePct: 15,
    typicalClearHour: "all day",
    flightRiskNote: "Generally stable; occasional westerly disturbances",
  },
  {
    month: 3,
    season: "pre-monsoon",
    seasonLabel: "Pre-Monsoon",
    morningClearChancePct: 65,
    afternoonRainChancePct: 25,
    typicalClearHour: "before noon",
    flightRiskNote: "Afternoon cloud build-up begins; morning windows reliable",
  },
  {
    month: 4,
    season: "pre-monsoon",
    seasonLabel: "Pre-Monsoon",
    morningClearChancePct: 55,
    afternoonRainChancePct: 40,
    typicalClearHour: "before 11 AM",
    flightRiskNote: "Increasing instability; early morning is prime window",
  },
  {
    month: 5,
    season: "pre-monsoon",
    seasonLabel: "Pre-Monsoon",
    morningClearChancePct: 45,
    afternoonRainChancePct: 55,
    typicalClearHour: "before 10 AM",
    flightRiskNote: "Late pre-monsoon; strong afternoon storms common",
  },
  {
    month: 6,
    season: "monsoon",
    seasonLabel: "Monsoon",
    morningClearChancePct: 20,
    afternoonRainChancePct: 85,
    typicalClearHour: "dawn only",
    flightRiskNote: "Peak monsoon; Lukla flights frequently cancelled",
  },
  {
    month: 7,
    season: "monsoon",
    seasonLabel: "Monsoon",
    morningClearChancePct: 15,
    afternoonRainChancePct: 90,
    typicalClearHour: "dawn only",
    flightRiskNote: "Heaviest monsoon month; most flights disrupted",
  },
  {
    month: 8,
    season: "monsoon",
    seasonLabel: "Monsoon",
    morningClearChancePct: 18,
    afternoonRainChancePct: 88,
    typicalClearHour: "dawn only",
    flightRiskNote: "Still deep monsoon; occasional break windows",
  },
  {
    month: 9,
    season: "monsoon",
    seasonLabel: "Late Monsoon",
    morningClearChancePct: 30,
    afternoonRainChancePct: 70,
    typicalClearHour: "before 9 AM",
    flightRiskNote: "Monsoon weakening; windows improving toward month end",
  },
  {
    month: 10,
    season: "post-monsoon",
    seasonLabel: "Post-Monsoon",
    morningClearChancePct: 80,
    afternoonRainChancePct: 15,
    typicalClearHour: "all morning",
    flightRiskNote: "Best season — clear stable conditions, ideal for trekking",
  },
  {
    month: 11,
    season: "post-monsoon",
    seasonLabel: "Post-Monsoon",
    morningClearChancePct: 85,
    afternoonRainChancePct: 10,
    typicalClearHour: "all day",
    flightRiskNote: "Peak trekking season; excellent visibility",
  },
  {
    month: 12,
    season: "winter",
    seasonLabel: "Winter",
    morningClearChancePct: 78,
    afternoonRainChancePct: 10,
    typicalClearHour: "all day",
    flightRiskNote: "Cold and clear; summit winds can be strong",
  },
];

export function currentSeasonalPattern(): SeasonalPattern {
  const month = new Date().getMonth() + 1;
  const pattern = SEASONAL_PATTERNS.find((p) => p.month === month);
  if (!pattern) throw new Error(`No seasonal pattern for month ${month}`);
  return pattern;
}
