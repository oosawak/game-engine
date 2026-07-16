import { describe, expect, it } from "vitest";
import { AssetManifest } from "../src/engine/resource/AssetManifest.js";
import { ResourceManager } from "../src/engine/resource/ResourceManager.js";
import { MintAssetManifest } from "../src/integration/mint/MintAssetManifest.js";
import { createMintRuntimeLoaderMap } from "../src/integration/mint/MintAssetRuntime.js";
import { type MintBridgeSet } from "../src/integration/mint/MintLoaderBridge.js";
import { MintMcpAdapter } from "../src/integration/mint/MintMcpAdapter.js";

describe("Mint integration", () => {
  it("normalizes provider metadata and fallback data", () => {
    const manifest = MintAssetManifest.fromJSON({
      id: "mint-assets",
      version: "1.0",
      provider: "Mint MCP",
      client: "mint-threejs-skills",
      description: "Mint generated assets",
      assets: [
        {
          id: "mint_world_splat",
          kind: "splat",
          source: "mint/world.splat",
          alias: ["world"],
          scriptName: "mint_world_splat",
          tags: ["generated"],
          meta: {
            streaming: true,
          },
        },
      ],
      fallback: {
        manifestId: "mint-assets-fallback",
        assetId: "mint_world_fallback",
        kind: "model",
        source: "mint/fallback/world.glb",
        reason: "offline preview",
      },
    });

    expect(manifest.provider).toBe("Mint MCP");
    expect(manifest.client).toBe("mint-threejs-skills");
    expect(manifest.findByKind("splat")).toHaveLength(1);
    expect(manifest.fallback?.assetId).toBe("mint_world_fallback");
    expect(manifest.toAssetManifest()).toBeInstanceOf(AssetManifest);
  });

  it("falls back to local data when the Mint provider fails", async () => {
    const fallback = MintAssetManifest.fromJSON({
      id: "mint-assets-fallback",
      version: "1.0",
      provider: "local",
      client: "editor",
      description: "local fallback",
      assets: [
        {
          id: "local_world",
          kind: "model",
          source: "fallback/world.glb",
          alias: ["world"],
          scriptName: "local_world",
        },
      ],
      fallback: {
        manifestId: "mint-assets-fallback",
        assetId: "local_world",
        kind: "model",
        source: "fallback/world.glb",
        reason: "cached offline copy",
      },
    });

    const adapter = new MintMcpAdapter({
      provider: {
        providerName: "Mint MCP",
        loadManifest: async () => {
          throw new Error("network unavailable");
        },
        resolveAssetSource: async () => null,
      },
      fallbackManifest: fallback,
    });

    const manifest = await adapter.loadManifest();

    expect(manifest.id).toBe("mint-assets-fallback");
    expect(adapter.getAssetManifest()?.findByKind("model")).toHaveLength(1);
    await expect(adapter.resolveAssetSource("world")).resolves.toBe("fallback/world.glb");
  });

  it("extracts splat, model, collider, and streaming policies from the manifest", async () => {
    const adapter = new MintMcpAdapter({
      provider: {
        providerName: "Mint MCP",
        loadManifest: async () => ({
          id: "mint-assets",
          version: "1.0",
          provider: "Mint MCP",
          client: "mint-threejs-skills",
          description: "mint assets",
          assets: [
            {
              id: "mint_world_splat",
              kind: "splat",
              source: "mint/world.splat",
              alias: ["world"],
              scriptName: "mint_world_splat",
              tags: ["streaming"],
              meta: {
                format: "gaussian-splat",
                streaming: true,
                scale: 1.5,
              },
            },
            {
              id: "mint_player_model",
              kind: "model",
              source: "mint/player.glb",
              alias: ["player"],
              scriptName: "mint_player_model",
              tags: ["character"],
              meta: {
                format: "gltf",
                colliders: true,
                rigged: true,
              },
            },
            {
              id: "mint_collision_map",
              kind: "collider",
              source: "mint/colliders.json",
              alias: ["colliders"],
              scriptName: "mint_collision_map",
              tags: ["collision"],
              meta: {
                shape: "mesh",
                layer: "world",
                trigger: false,
              },
            },
          ],
          fallback: null,
        }),
      },
    });

    await adapter.loadManifest();

    expect(adapter.getGaussianSplatAssets()).toHaveLength(1);
    expect(adapter.getGaussianSplatAssets()[0]?.policy.streaming).toBe(true);
    expect(adapter.getModelAssets()).toHaveLength(1);
    expect(adapter.getModelAssets()[0]?.policy.colliders).toBe(true);
    expect(adapter.getColliderAssets()).toHaveLength(1);
    expect(adapter.getColliderAssets()[0]?.policy.shape).toBe("mesh");
    expect(adapter.getStreamingAssets()).toHaveLength(1);
    expect(adapter.getStreamingAssets()[0]?.policy.enabled).toBe(true);
  });

  it("builds a load plan and executes it through a caller supplied loader", async () => {
    const adapter = new MintMcpAdapter({
      provider: {
        providerName: "Mint MCP",
        loadManifest: async () => ({
          id: "mint-assets",
          version: "1.0",
          provider: "Mint MCP",
          client: "mint-threejs-skills",
          description: "mint assets",
          assets: [
            {
              id: "mint_world_splat",
              kind: "splat",
              source: "mint/world.splat",
              alias: ["world"],
              scriptName: "mint_world_splat",
              tags: ["streaming"],
              meta: {
                streaming: true,
              },
            },
            {
              id: "mint_player_model",
              kind: "model",
              source: "mint/player.glb",
              alias: ["player"],
              scriptName: "mint_player_model",
              tags: ["character"],
              meta: {
                format: "gltf",
              },
            },
          ],
          fallback: null,
        }),
      },
    });

    await adapter.loadManifest();

    const plan = adapter.createLoadPlan();
    expect(plan.splats).toHaveLength(1);
    expect(plan.models).toHaveLength(1);
    expect(plan.colliders).toHaveLength(0);
    expect(plan.streaming).toHaveLength(1);

    const loaded = await adapter.loadWith(async (entry) => ({
      key: `${entry.kind}:${entry.asset.id}`,
      source: entry.source,
    }));

    expect(loaded).toHaveLength(3);
    expect(loaded[0]?.loaded).toEqual({ key: "gaussian-splat:mint_world_splat", source: "mint/world.splat" });
    expect(loaded[1]?.loaded).toEqual({ key: "model:mint_player_model", source: "mint/player.glb" });
  });

  it("loads runtime assets through per-kind loaders", async () => {
    const adapter = new MintMcpAdapter({
      provider: {
        providerName: "Mint MCP",
        loadManifest: async () => ({
          id: "mint-assets",
          version: "1.0",
          provider: "Mint MCP",
          client: "mint-threejs-skills",
          description: "mint assets",
          assets: [
            {
              id: "mint_world_splat",
              kind: "splat",
              source: "mint/world.splat",
              alias: ["world"],
              scriptName: "mint_world_splat",
              tags: ["streaming"],
              meta: {
                streaming: true,
              },
            },
            {
              id: "mint_player_model",
              kind: "model",
              source: "mint/player.glb",
              alias: ["player"],
              scriptName: "mint_player_model",
              tags: ["character"],
              meta: {
                format: "glb",
              },
            },
          ],
          fallback: null,
        }),
      },
    });

    await adapter.loadManifest();

    const runtime = createMintRuntimeLoaderMap([
      {
        kind: "gaussian-splat",
        load: async (entry) => ({ loaded: `splat:${entry.asset.id}` }),
      },
      {
        kind: "model",
        load: async (entry) => ({ loaded: `model:${entry.asset.id}` }),
      },
      {
        kind: "streaming",
        load: async (entry) => ({ loaded: `stream:${entry.asset.id}` }),
      },
    ]);

    const summary = await adapter.loadRuntime(runtime);

    expect(summary.plan.splats).toHaveLength(1);
    expect(summary.plan.models).toHaveLength(1);
    expect(summary.results).toHaveLength(3);
    expect(summary.results[0]?.loaded).toEqual({ loaded: "splat:mint_world_splat" });
    expect(summary.results[1]?.loaded).toEqual({ loaded: "model:mint_player_model" });
    expect(summary.results[2]?.loaded).toEqual({ loaded: "stream:mint_world_splat" });
  });

  it("registers Mint manifest loaders in the resource manager", async () => {
    const manager = new ResourceManager();
    const adapter = new MintMcpAdapter({
      provider: {
        providerName: "Mint MCP",
        loadManifest: async () => ({
          id: "mint-assets",
          version: "1.0",
          provider: "Mint MCP",
          client: "mint-threejs-skills",
          description: "mint assets",
          assets: [
            {
              id: "mint_world_splat",
              kind: "splat",
              source: "mint/world.splat",
              alias: ["world"],
              scriptName: "mint_world_splat",
              tags: ["streaming"],
              meta: {
                streaming: true,
              },
            },
          ],
          fallback: null,
        }),
      },
      resourceManager: manager,
    });

    expect(adapter.registerLoaders()).toBe(manager);

    const manifest = await manager.load<MintAssetManifest>("mint-manifest", "mint-assets", JSON.stringify({
      id: "mint-assets",
      version: "1.0",
      provider: "Mint MCP",
      client: "mint-threejs-skills",
      description: "mint assets",
      assets: [],
      fallback: null,
    }));

    expect(manifest).toBeInstanceOf(MintAssetManifest);
    expect(manifest.provider).toBe("Mint MCP");
  });

  it("loads runtime assets through a bridge set", async () => {
    const adapter = new MintMcpAdapter({
      provider: {
        providerName: "Mint MCP",
        loadManifest: async () => ({
          id: "mint-assets",
          version: "1.0",
          provider: "Mint MCP",
          client: "mint-threejs-skills",
          description: "mint assets",
          assets: [
            {
              id: "mint_world_splat",
              kind: "splat",
              source: "mint/world.splat",
              alias: ["world"],
              scriptName: "mint_world_splat",
              tags: ["streaming"],
              meta: {
                streaming: true,
              },
            },
            {
              id: "mint_player_model",
              kind: "model",
              source: "mint/player.glb",
              alias: ["player"],
              scriptName: "mint_player_model",
              tags: ["character"],
              meta: {
                format: "gltf",
              },
            },
            {
              id: "mint_collision_map",
              kind: "collider",
              source: "mint/colliders.json",
              alias: ["colliders"],
              scriptName: "mint_collision_map",
              tags: ["collision"],
              meta: {
                shape: "mesh",
                layer: "world",
                trigger: false,
              },
            },
          ],
          fallback: null,
        }),
      },
    });

    await adapter.loadManifest();

    const bridges: MintBridgeSet<{ type: string }> = {
      splat: {
        load: async (context) => ({ type: `${context.kind}:${context.asset.id}` }),
      },
      model: {
        load: async (context) => ({ type: `${context.kind}:${context.asset.id}` }),
      },
      collider: {
        load: async (context) => ({ type: `${context.kind}:${context.asset.id}` }),
      },
    };

    const summary = await adapter.loadThroughBridge(bridges);

    expect(summary.plan.splats).toHaveLength(1);
    expect(summary.plan.models).toHaveLength(1);
    expect(summary.plan.colliders).toHaveLength(1);
    expect(summary.results).toHaveLength(3);
    expect(summary.results[0]?.loaded).toEqual({ type: "gaussian-splat:mint_world_splat" });
    expect(summary.results[1]?.loaded).toEqual({ type: "model:mint_player_model" });
    expect(summary.results[2]?.loaded).toEqual({ type: "collider:mint_collision_map" });
  });
});
