import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AssetManifest } from "../src/engine/resource/AssetManifest.js";
import { ResourceManager } from "../src/engine/resource/ResourceManager.js";

describe("Asset manifest", () => {
  it("normalizes asset data and supports lookup helpers", () => {
    const manifest = AssetManifest.fromJSON({
      id: "shared-assets",
      version: "1.0",
      assets: [
        {
          id: "dataset_bow_active_001",
          kind: "vrm-motion",
          source: "https://raw.githubusercontent.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset/master/dataset/Bandai-Namco-Research-Motiondataset-1/data/dataset-1_bow_active_001.bvh",
          alias: ["おじぎ", "bow"],
          scriptName: "dataset_bow_active_001",
          tags: ["gesture", "one-shot", "pose"],
          meta: {
            duration: 3,
            loop: false,
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
    expect(manifest.getAsset("dataset_bow_active_001")?.scriptName).toBe("dataset_bow_active_001");
    expect(manifest.findByAlias("おじぎ")?.id).toBe("dataset_bow_active_001");
    expect(manifest.findByTag("one-shot")).toHaveLength(1);
    expect(manifest.findByKind("image")).toHaveLength(1);
    expect(manifest.toJSON().assets).toHaveLength(2);
  });

  it("accepts the shared asset sample with multiple kinds", async () => {
    const source = await readFile(join(process.cwd(), "docs", "shared-assets.json"), "utf8");
    const manifest = AssetManifest.fromJSON(JSON.parse(source));

    expect(manifest.findByKind("vrm-motion")).toHaveLength(2);
    expect(manifest.findByKind("image")).toHaveLength(2);
    expect(manifest.findByKind("audio")).toHaveLength(1);
    expect(manifest.findByKind("scene")).toHaveLength(2);
    expect(manifest.findByAlias("field_bgm")?.id).toBe("audio_bgm_field");
  });

  it("accepts Mint asset kinds in the shared manifest format", async () => {
    const source = await readFile(join(process.cwd(), "docs", "mint-assets.json"), "utf8");
    const manifest = AssetManifest.fromJSON(JSON.parse(source));

    expect(manifest.findByKind("splat")).toHaveLength(1);
    expect(manifest.findByKind("model")).toHaveLength(1);
    expect(manifest.findByAlias("ミントワールド")?.id).toBe("mint_world_splat");
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
