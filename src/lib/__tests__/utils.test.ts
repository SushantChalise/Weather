import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("joins single class", () => {
    expect(cn("a")).toBe("a");
  });
  it("joins multiple classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("skips falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
  it("handles conditionals", () => {
    expect(cn("a", true && "b", false && "c")).toBe("a b");
  });
  it("returns empty for no truthy args", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});
