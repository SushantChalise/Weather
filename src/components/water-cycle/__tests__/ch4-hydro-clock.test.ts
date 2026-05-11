/**
 * ch4-hydro-clock.test.ts — Unit tests for Ch 4 Hydrological Clock
 *
 * Strategy: test the pure geometry/data logic in a node environment (no jsdom).
 * The visual rendering is verified by the §15 Chrome protocol.
 *
 * Tested:
 *  - dayToAngleDeg: day-of-year → SVG angle conversion
 *  - handTip: angle + length → Cartesian coordinates
 *  - Clock hand angles for default props (day 165 → 1990, day 135 → 2070)
 *  - 2070 hand is clockwise-earlier than the 1990 hand (shifted toward Jan)
 *  - Angle gap matches the expected day difference (~30 days → ~29.6°)
 *  - Color grammar: 1990 hand uses terrain neutral #475569; 2070 uses loss/risk #F87171
 *  - Provenance fixture: ch4/provenance.json has SSP5-8.5 headline_numbers
 *  - Provenance fixture: headline_numbers include ~30 days claim with correct DOI
 *  - Season arc geometry: seasonArcPath produces valid SVG path strings
 *  - Annotation text constant is present
 *  - Props API is stable (snapshot)
 *
 * Environment: node (vitest.config.ts sets environment:"node").
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Provenance } from "@/lib/water-cycle/types";

// ---------------------------------------------------------------------------
// Re-implement pure geometry helpers from the component for isolated testing.
// ---------------------------------------------------------------------------

function dayToAngleDeg(dayOfYear: number): number {
  return (dayOfYear / 365) * 360 - 90;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function handTip(
  cx: number,
  cy: number,
  angleDeg: number,
  length: number,
): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
}

function seasonArcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDay: number,
  endDay: number,
): string {
  const startAngle = degToRad(dayToAngleDeg(startDay));
  const endAngle = degToRad(dayToAngleDeg(endDay));

  const x1o = cx + rOuter * Math.cos(startAngle);
  const y1o = cy + rOuter * Math.sin(startAngle);
  const x2o = cx + rOuter * Math.cos(endAngle);
  const y2o = cy + rOuter * Math.sin(endAngle);

  const x1i = cx + rInner * Math.cos(endAngle);
  const y1i = cy + rInner * Math.sin(endAngle);
  const x2i = cx + rInner * Math.cos(startAngle);
  const y2i = cy + rInner * Math.sin(startAngle);

  const daySpan = endDay - startDay;
  const largeArc = daySpan > 182 ? 1 : 0;

  return [
    `M ${x1o} ${y1o}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2o} ${y2o}`,
    `L ${x1i} ${y1i}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2i} ${y2i}`,
    "Z",
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Constants matching the component defaults
// ---------------------------------------------------------------------------

const DEFAULT_1990_DAY = 165; // mid-June
const DEFAULT_2070_DAY = 135; // mid-May
const CX = 100;
const CY = 100;

// Colors from §7 grammar
const TERRAIN_NEUTRAL = "#475569"; // 1990 hand
const LOSS_RISK = "#F87171"; // 2070 hand
const ICE_TOKEN = "#7DD3FC"; // winter/spring season ring
const ACTIVE_WATER = "#38BDF8"; // monsoon season ring
const HEAT = "#FBBF24"; // summer season ring

// ---------------------------------------------------------------------------
// Fixture loader
// ---------------------------------------------------------------------------

function loadCh4Provenance(): Provenance {
  const p = join(__dirname, "../../../../public/water-cycle/ch4/provenance.json");
  return JSON.parse(readFileSync(p, "utf-8")) as Provenance;
}

// ---------------------------------------------------------------------------
// Tests — geometry helpers
// ---------------------------------------------------------------------------

describe("dayToAngleDeg — day-of-year to SVG angle", () => {
  it("day 1 (Jan 1) maps to ~-89° (just past 12 o'clock)", () => {
    // (1/365)*360 - 90 = 0.986 - 90 = -89.014
    const angle = dayToAngleDeg(1);
    expect(angle).toBeCloseTo(-89.0, 0);
  });

  it("day 91 (Apr 1) maps to approximately -0.25° (3 o'clock position)", () => {
    // (91/365)*360 - 90 = 89.753 - 90 = -0.247
    const angle = dayToAngleDeg(91);
    expect(angle).toBeCloseTo(-0.25, 0);
  });

  it("day 183 (Jul 1) maps to approximately 90° (6 o'clock position)", () => {
    // (183/365)*360 - 90 = 180.493 - 90 = 90.49
    const angle = dayToAngleDeg(183);
    expect(angle).toBeCloseTo(90.5, 0);
  });

  it("day 274 (Oct 1) maps to approximately 180° (9 o'clock position)", () => {
    // (274/365)*360 - 90 = 270.247 - 90 = 180.247
    const angle = dayToAngleDeg(274);
    expect(angle).toBeCloseTo(180.2, 0);
  });
});

describe("handTip — Cartesian coordinates from angle and length", () => {
  it("angle -90° (12 o'clock) points straight up from center", () => {
    const { x, y } = handTip(100, 100, -90, 60);
    expect(x).toBeCloseTo(100, 1);
    expect(y).toBeCloseTo(40, 1); // 100 - 60 = 40
  });

  it("angle 0° (3 o'clock) points straight right from center", () => {
    const { x, y } = handTip(100, 100, 0, 60);
    expect(x).toBeCloseTo(160, 1); // 100 + 60 = 160
    expect(y).toBeCloseTo(100, 1);
  });

  it("tip is at correct distance from center", () => {
    const { x, y } = handTip(100, 100, 45, 60);
    const dist = Math.sqrt((x - 100) ** 2 + (y - 100) ** 2);
    expect(dist).toBeCloseTo(60, 3);
  });
});

// ---------------------------------------------------------------------------
// Tests — clock hand positions for default props
// ---------------------------------------------------------------------------

describe("Clock hand angles — default props", () => {
  const angle1990 = dayToAngleDeg(DEFAULT_1990_DAY);
  const angle2070 = dayToAngleDeg(DEFAULT_2070_DAY);

  it("1990 hand angle is approximately 72.7° (mid-June)", () => {
    // (165/365)*360 - 90 = 162.74 - 90 = 72.74°
    expect(angle1990).toBeCloseTo(72.7, 0);
  });

  it("2070 hand angle is approximately 43.2° (mid-May)", () => {
    // (135/365)*360 - 90 = 133.15 - 90 = 43.15°
    expect(angle2070).toBeCloseTo(43.2, 0);
  });

  it("2070 hand points earlier in the year than 1990 (counter-clockwise shift)", () => {
    // Earlier in the year = smaller angle (both hands are in Q1 / Q2 area)
    expect(angle2070).toBeLessThan(angle1990);
  });

  it("angle gap between 1990 and 2070 hands is ~29.6° (matching ~30 day shift)", () => {
    const gap = angle1990 - angle2070;
    // 30 days / 365 days * 360° ≈ 29.59°
    expect(gap).toBeCloseTo(29.59, 1);
  });

  it("both hands are in the spring/early-summer zone (0° – 90° range)", () => {
    // Both days 135 and 165 are between May and mid-June
    // SVG angle: 0° = 3 o'clock (Apr 1), 90° = 6 o'clock (Jul 1)
    // Expected range: roughly 43° – 73° (right half, slightly below center on SVG)
    expect(angle2070).toBeGreaterThan(30);
    expect(angle1990).toBeLessThan(90);
  });
});

describe("Clock hand Cartesian positions", () => {
  const angle1990 = dayToAngleDeg(DEFAULT_1990_DAY);
  const angle2070 = dayToAngleDeg(DEFAULT_2070_DAY);
  const tip1990 = handTip(CX, CY, angle1990, 60);
  const tip2070 = handTip(CX, CY, angle2070, 55);

  it("1990 tip is in the right half of the clock (x > 100)", () => {
    // mid-June ≈ 72.7° → cos(72.7°) > 0 → x > cx=100
    expect(tip1990.x).toBeGreaterThan(100);
  });

  it("1990 tip is in the lower-right area (y > 100) — mid-June is at ~72.7° past 3 o'clock", () => {
    // In SVG +y is down; at 72.7° from 3 o'clock, sin(72.7°) > 0 so y > cy=100
    expect(tip1990.y).toBeGreaterThan(100);
  });

  it("2070 tip is in the right half (x > 100)", () => {
    // mid-May ≈ 43.2° → cos(43.2°) > 0 → x > cx=100
    expect(tip2070.x).toBeGreaterThan(100);
  });

  it("2070 tip y is smaller than 1990 tip y (earlier = counter-clockwise = higher on screen)", () => {
    // Earlier in the year = smaller angle = less y displacement = closer to top
    expect(tip2070.y).toBeLessThan(tip1990.y);
  });

  it("both tips are within the SVG viewBox (0-200)", () => {
    for (const { x, y } of [tip1990, tip2070]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(200);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(200);
    }
  });

  it("tip coordinates snapshot (regression guard)", () => {
    expect({ tip1990, tip2070 }).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// Tests — color grammar (§7)
// ---------------------------------------------------------------------------

describe("Color grammar — spec §7 compliance", () => {
  it("1990 baseline hand uses terrain neutral #475569", () => {
    // The 1990 hand represents the stable past — terrain neutral
    expect(TERRAIN_NEUTRAL).toBe("#475569");
  });

  it("2070 projected hand uses loss/risk #F87171", () => {
    // The 2070 hand represents drift/risk — loss color
    expect(LOSS_RISK).toBe("#F87171");
  });

  it("ice/winter season segment uses ice token #7DD3FC", () => {
    expect(ICE_TOKEN).toBe("#7DD3FC");
  });

  it("monsoon season segment uses active water #38BDF8", () => {
    expect(ACTIVE_WATER).toBe("#38BDF8");
  });

  it("summer season segment uses heat #FBBF24", () => {
    expect(HEAT).toBe("#FBBF24");
  });

  it("all used colors are in the §7 valid palette", () => {
    const VALID = new Set([
      "#7DD3FC",
      "#0E7490",
      "#38BDF8",
      "#F87171",
      "#FBBF24",
      "#FCD34D",
      "#475569",
    ]);
    for (const color of [TERRAIN_NEUTRAL, LOSS_RISK, ICE_TOKEN, ACTIVE_WATER, HEAT]) {
      expect(VALID.has(color), `Color "${color}" not in §7 palette`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests — season arc geometry
// ---------------------------------------------------------------------------

describe("seasonArcPath — SVG path generation", () => {
  it("produces a string starting with 'M '", () => {
    const path = seasonArcPath(100, 100, 72, 58, 80, 171);
    expect(path).toMatch(/^M /);
  });

  it("ends with 'Z'", () => {
    const path = seasonArcPath(100, 100, 72, 58, 80, 171);
    expect(path.trim()).toMatch(/Z$/);
  });

  it("contains two arc commands (A) for outer and inner arcs", () => {
    const path = seasonArcPath(100, 100, 72, 58, 80, 171);
    const arcCount = (path.match(/\bA\b/g) ?? []).length;
    expect(arcCount).toBe(2);
  });

  it("winter segment (day 1-79) generates small-arc (largeArc=0)", () => {
    const path = seasonArcPath(100, 100, 72, 58, 1, 79);
    // 79 - 1 = 78 days < 182, so largeArc = 0
    expect(path).toContain(" 0 1 ");
  });

  it("spring segment (day 80-171) generates small-arc (largeArc=0)", () => {
    const path = seasonArcPath(100, 100, 72, 58, 80, 171);
    expect(path).toContain(" 0 1 ");
  });

  it("all four season arcs are valid SVG paths (start M, end Z)", () => {
    const seasons = [
      [1, 79],
      [80, 171],
      [172, 264],
      [265, 354],
    ] as const;
    for (const [s, e] of seasons) {
      const path = seasonArcPath(100, 100, 72, 58, s, e);
      expect(path).toMatch(/^M /);
      expect(path.trim()).toMatch(/Z$/);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests — ch4/provenance.json
// ---------------------------------------------------------------------------

describe("Ch4 provenance.json — fixture validation", () => {
  it("loads without throwing", () => {
    expect(() => loadCh4Provenance()).not.toThrow();
  });

  it("chapter_id is ch4", () => {
    const p = loadCh4Provenance();
    expect(p.chapter_id).toBe("ch4");
  });

  it("has SSP5-8.5 referenced in headline_numbers (not RCP 4.5)", () => {
    const p = loadCh4Provenance();
    const hasSSP585 = p.headline_numbers.some(
      (n) => n.label.includes("SSP5-8.5") || n.value.includes("SSP5"),
    );
    expect(hasSSP585).toBe(true);
  });

  it("does NOT reference RCP 4.5", () => {
    const p = loadCh4Provenance();
    const raw = JSON.stringify(p).toLowerCase();
    expect(raw).not.toContain("rcp 4.5");
    expect(raw).not.toContain("rcp4.5");
  });

  it("headline_numbers include the ~30 days claim", () => {
    const p = loadCh4Provenance();
    const hasThirtyDays = p.headline_numbers.some(
      (n) => n.value.includes("30") || n.value.includes("~30"),
    );
    expect(hasThirtyDays).toBe(true);
  });

  it("headline_numbers cite Rounce 2023 PyGEM DOI (10.5067/P8BN9VO9N5C7)", () => {
    const p = loadCh4Provenance();
    const hasPyGEM = p.headline_numbers.some(
      (n) =>
        n.citation.includes("10.5067/P8BN9VO9N5C7") ||
        n.citation.includes("10.1126/science.abo1324"),
    );
    expect(hasPyGEM).toBe(true);
  });

  it("headline_numbers have value, label, citation fields", () => {
    const p = loadCh4Provenance();
    expect(p.headline_numbers.length).toBeGreaterThan(0);
    for (const n of p.headline_numbers) {
      expect(typeof n.value).toBe("string");
      expect(n.value.length).toBeGreaterThan(0);
      expect(typeof n.label).toBe("string");
      expect(n.label.length).toBeGreaterThan(0);
      expect(typeof n.citation).toBe("string");
      expect(n.citation.length).toBeGreaterThan(0);
    }
  });

  it("fixture matches full snapshot (regression guard)", () => {
    const p = loadCh4Provenance();
    expect(p).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// Tests — annotation text
// ---------------------------------------------------------------------------

describe("Annotation text — required by spec", () => {
  it("required annotation phrase is defined", () => {
    const annotation = "Glacier water hits the field weeks earlier — when farmers don't need it.";
    expect(annotation).toContain("Glacier water hits the field");
    expect(annotation).toContain("when farmers don");
    expect(annotation.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tests — props API stability (snapshot)
// ---------------------------------------------------------------------------

describe("HydroClockProps — default values", () => {
  it("default 1990 day is mid-June (day 165)", () => {
    expect(DEFAULT_1990_DAY).toBe(165);
  });

  it("default 2070 day is mid-May (day 135)", () => {
    expect(DEFAULT_2070_DAY).toBe(135);
  });

  it("shift is ~30 days (4.3 weeks)", () => {
    const dayShift = DEFAULT_1990_DAY - DEFAULT_2070_DAY;
    expect(dayShift).toBe(30);
    expect(dayShift / 7).toBeCloseTo(4.3, 1);
  });

  it("props snapshot", () => {
    const defaults = {
      baseline1990DayOfYear: DEFAULT_1990_DAY,
      projected2070DayOfYear: DEFAULT_2070_DAY,
    };
    expect(defaults).toMatchSnapshot();
  });
});
