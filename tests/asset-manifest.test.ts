import { describe, expect, it } from "vitest";
import { AssetManifest } from "../src/engine/resource/AssetManifest.js";
import { ResourceManager } from "../src/engine/resource/ResourceManager.js";

describe("Asset manifest", () => {
  it("normalizes asset data and supports lookup helpers", () => {
    const manifest = AssetManifest.fromJSON({
      id: "shared-assets",
      version: "1.0",
      assets: [
        {
          id: "vrm_idle_default",
          kind: "vrm-motion",
          source: "motions/idle.vrma",
          alias: ["待機", "idle"],
          scriptName: "idle_motion",
          tags: ["loop", "neutral"],
          meta: {
            duration: 12,
            loop: true,
          },
        },
        {
          id: "ui_title_logo",
          kind: "image",
          source: "images/title-logo.png",
          alias: ["タイトルロゴ"],
        },
      ],
    });

    expect(manifest.id).toBe("shared-assets");
    expect(manifest.getAsset("vrm_idle_default")?.scriptName).toBe("idle_motion");
    expect(manifest.findByAlias("待機")?.id).toBe("vrm_idle_default");
    expect(manifest.findByTag("loop")).toHaveLength(1);
    expect(manifest.findByKind("image")).toHaveLength(1);
    expect(manifest.toJSON().assets).toHaveLength(2);
  });

  it("loads shared asset manifests through the resource manager", async () => {
    const manager = new ResourceManager();

    manager.registerLoader("asset-manifest", {
      load: async (source: string) => AssetManifest.fromJSON(JSON.parse(source)),
    });

    const manifestJson = JSON.stringify({
      id: "shared-assets",
      version: "1.0",
      assets: [
        {
          id: "sprite_walk",
          kind: "sprite-animation",
          source: "sprites/walk.json",
          alias: ["walk"],
          scriptName: "sprite_walk",
        },
      ],
    });

    const manifest = await manager.load<AssetManifest>("asset-manifest", "shared-assets", manifestJson);
    const cached = manager.get<AssetManifest>("asset-manifest", "shared-assets");

    expect(manifest.getAsset("sprite_walk")?.kind).toBe("sprite-animation");
    expect(cached).toBe(manifest);
  });
});
