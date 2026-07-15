import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("VRM body and pose data", () => {
  it("keeps motion body data separate from pose data", async () => {
    const bodySource = await readFile(join(process.cwd(), "docs", "vrm-body-data.json"), "utf8");
    const poseSource = await readFile(join(process.cwd(), "docs", "vrm-pose-data.json"), "utf8");
    const bodyData = JSON.parse(bodySource);
    const poseData = JSON.parse(poseSource);

    expect(Array.isArray(bodyData.bodies)).toBe(true);
    expect(Array.isArray(poseData.poses)).toBe(true);

    const bodyIds = bodyData.bodies.map((entry: { id: string }) => entry.id);
    const poseIds = poseData.poses.map((entry: { id: string }) => entry.id);

    expect(bodyIds).toContain("vrm_idle_default");
    expect(poseIds).toContain("vrm_idle_default");
    expect(bodyIds).toEqual(poseIds);
    expect(bodyData.bodies[0]).not.toHaveProperty("boneRotations");
    expect(poseData.poses[0]).not.toHaveProperty("source");
  });
});
