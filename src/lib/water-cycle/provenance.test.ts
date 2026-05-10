import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validate } from "../../../scripts/render/water-cycle/shared/provenance-schema";

function loadFixture(name: string): unknown {
  const p = join(__dirname, "../../../tests/fixtures/water-cycle", name);
  return JSON.parse(readFileSync(p, "utf-8"));
}

describe("provenance schema validator", () => {
  describe("valid fixture (ch0)", () => {
    const raw = loadFixture("provenance-ch0-valid.json");

    it("returns ok: true", () => {
      const result = validate(raw);
      expect(result.ok).toBe(true);
    });

    it("has no errors array when valid", () => {
      const result = validate(raw);
      if (!result.ok) {
        // Fail with the error list for easier debugging
        expect(result.errors).toEqual([]);
      }
    });
  });

  describe("invalid fixture (ch0 — missing required fields)", () => {
    const raw = loadFixture("provenance-ch0-invalid.json");

    it("returns ok: false", () => {
      const result = validate(raw);
      expect(result.ok).toBe(false);
    });

    it("reports errors for missing citation in headline_numbers", () => {
      const result = validate(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const citationError = result.errors.some(
          (e) => e.includes("headline_numbers") && e.includes("citation"),
        );
        expect(citationError).toBe(true);
      }
    });

    it("reports error for missing generated_at", () => {
      const result = validate(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const err = result.errors.some((e) => e.includes("generated_at"));
        expect(err).toBe(true);
      }
    });

    it("reports error for missing blender_version", () => {
      const result = validate(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const err = result.errors.some((e) => e.includes("blender_version"));
        expect(err).toBe(true);
      }
    });

    it("reports error for missing bpy_script_hash", () => {
      const result = validate(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const err = result.errors.some((e) => e.includes("bpy_script_hash"));
        expect(err).toBe(true);
      }
    });
  });

  describe("edge cases", () => {
    it("rejects non-object root", () => {
      const result = validate("not an object");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]).toMatch(/root/);
      }
    });

    it("rejects invalid chapter_id", () => {
      const raw = loadFixture("provenance-ch0-valid.json");
      const mutated = { ...(raw as Record<string, unknown>), chapter_id: "ch99" };
      const result = validate(mutated);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.includes("chapter_id"))).toBe(true);
      }
    });

    it("rejects fps !== 30", () => {
      const raw = loadFixture("provenance-ch0-valid.json");
      const mutated = { ...(raw as Record<string, unknown>), fps: 24 };
      const result = validate(mutated);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.includes("fps"))).toBe(true);
      }
    });

    it("rejects wrong resolution", () => {
      const raw = loadFixture("provenance-ch0-valid.json");
      const mutated = {
        ...(raw as Record<string, unknown>),
        resolution: { w: 1920, h: 1080 },
      };
      const result = validate(mutated);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.includes("resolution"))).toBe(true);
      }
    });

    it("rejects scene_layer with invalid color format", () => {
      const raw = loadFixture("provenance-ch0-valid.json");
      const typed = raw as Record<string, unknown>;
      const layers = typed.scene_layers as Record<string, unknown>[];
      const mutated = {
        ...typed,
        scene_layers: [{ ...layers[0], color: "blue" }, ...layers.slice(1)],
      };
      const result = validate(mutated);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.includes("color"))).toBe(true);
      }
    });

    it("rejects duplicate scene_layer ids", () => {
      const raw = loadFixture("provenance-ch0-valid.json");
      const typed = raw as Record<string, unknown>;
      const layers = typed.scene_layers as Record<string, unknown>[];
      const firstId = (layers[0] as Record<string, unknown>).id;
      const mutated = {
        ...typed,
        scene_layers: [layers[0], { ...layers[1], id: firstId }],
      };
      const result = validate(mutated);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.includes("duplicate id"))).toBe(true);
      }
    });

    it("rejects bpy_script_hash that is not 64 lowercase hex", () => {
      const raw = loadFixture("provenance-ch0-valid.json");
      const mutated = {
        ...(raw as Record<string, unknown>),
        bpy_script_hash: "tooshort",
      };
      const result = validate(mutated);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.includes("bpy_script_hash"))).toBe(true);
      }
    });
  });
});
