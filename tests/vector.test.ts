import { describe, expect, it } from "vitest";
import { Vector2 } from "../src/engine/math/Vector2.js";
import { Vector3 } from "../src/engine/math/Vector3.js";

describe("Vector math", () => {
  it("adds and normalizes Vector2", () => {
    const vector = new Vector2(3, 4);

    expect(vector.length()).toBe(5);
    expect(vector.normalize().length()).toBeCloseTo(1);
  });

  it("supports Vector3 arithmetic", () => {
    const vector = new Vector3(1, 2, 3);
    vector.add(new Vector3(4, 5, 6));

    expect(vector.equals(new Vector3(5, 7, 9))).toBe(true);
  });
});
