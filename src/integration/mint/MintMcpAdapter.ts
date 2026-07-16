import type { AssetEntry } from "../../engine/resource/AssetManifest.js";
import { AssetManifest } from "../../engine/resource/AssetManifest.js";
import type { ResourceManager } from "../../engine/resource/ResourceManager.js";
import { MintAssetManifest } from "./MintAssetManifest.js";
import {
  getMintColliderPolicy,
  getMintGaussianSplatPolicy,
  getMintModelPolicy,
  getMintStreamingPolicy,
  type MintColliderPolicy,
  type MintGaussianSplatPolicy,
  type MintModelPolicy,
  type MintStreamingPolicy,
} from "./MintAssetPolicy.js";
import type { MintRuntimeLoaderMap, MintRuntimeLoadSummary } from "./MintAssetRuntime.js";
import type { MintLoadPlan, MintLoadPlanEntry, MintLoadResult } from "./MintLoadPlan.js";
import { toLoaderContext, type MintBridgeSet } from "./MintLoaderBridge.js";
import type { MintAssetProvider } from "./MintAssetProvider.js";

export interface MintMcpAdapterOptions {
  readonly provider: MintAssetProvider;
  readonly fallbackManifest?: MintAssetManifest | null;
  readonly resourceManager?: ResourceManager;
}

export class MintMcpAdapter {
  private manifest: MintAssetManifest | null = null;

  public constructor(private readonly options: MintMcpAdapterOptions) {}

  public get providerName(): string {
    return this.options.provider.providerName;
  }

  public getManifest(): MintAssetManifest | null {
    return this.manifest;
  }

  public getAssetManifest(): AssetManifest | null {
    return this.manifest?.toAssetManifest() ?? this.options.fallbackManifest?.toAssetManifest() ?? null;
  }

  public async loadManifest(): Promise<MintAssetManifest> {
    try {
      const manifest = MintAssetManifest.fromJSON(await this.options.provider.loadManifest());
      this.manifest = manifest;
      return manifest;
    } catch (error) {
      return this.loadFallbackManifest(error);
    }
  }

  public async loadFallbackManifest(_cause?: unknown): Promise<MintAssetManifest> {
    if (this.options.provider.loadFallbackManifest) {
      const providerFallback = await this.options.provider.loadFallbackManifest();

      if (providerFallback) {
        const manifest = MintAssetManifest.fromJSON(providerFallback);
        this.manifest = manifest;
        return manifest;
      }
    }

    if (this.options.fallbackManifest) {
      this.manifest = this.options.fallbackManifest;
      return this.options.fallbackManifest;
    }

    throw new Error(`Mint provider "${this.providerName}" failed and no fallback manifest was configured.`);
  }

  public findAsset(idOrAlias: string): AssetEntry | null {
    const manifest = this.manifest ?? this.options.fallbackManifest;

    if (!manifest) {
      return null;
    }

    return manifest.getAsset(idOrAlias) ?? manifest.findByAlias(idOrAlias);
  }

  public getGaussianSplatAssets(): Array<{ asset: AssetEntry; policy: MintGaussianSplatPolicy }> {
    return this.getCurrentManifest()
      .findByKind("splat")
      .map((asset) => ({ asset, policy: getMintGaussianSplatPolicy(asset) }))
      .filter((entry): entry is { asset: AssetEntry; policy: MintGaussianSplatPolicy } => entry.policy !== null);
  }

  public getModelAssets(): Array<{ asset: AssetEntry; policy: MintModelPolicy }> {
    return this.getCurrentManifest()
      .findByKind("model")
      .concat(this.getCurrentManifest().findByKind("vrm"))
      .map((asset) => ({ asset, policy: getMintModelPolicy(asset) }))
      .filter((entry): entry is { asset: AssetEntry; policy: MintModelPolicy } => entry.policy !== null);
  }

  public getColliderAssets(): Array<{ asset: AssetEntry; policy: MintColliderPolicy }> {
    return this.getCurrentManifest()
      .findByKind("collider")
      .map((asset) => ({ asset, policy: getMintColliderPolicy(asset) }))
      .filter((entry): entry is { asset: AssetEntry; policy: MintColliderPolicy } => entry.policy !== null);
  }

  public getStreamingAssets(): Array<{ asset: AssetEntry; policy: MintStreamingPolicy }> {
    return this.getCurrentManifest()
      .findByTag("streaming")
      .map((asset) => ({ asset, policy: getMintStreamingPolicy(asset) }))
      .filter((entry): entry is { asset: AssetEntry; policy: MintStreamingPolicy } => entry.policy !== null);
  }

  public createLoadPlan(): MintLoadPlan {
    const manifest = this.getCurrentManifest();

    return {
      splats: this.createLoadEntries(manifest.findByKind("splat"), getMintGaussianSplatPolicy, "gaussian-splat"),
      models: this.createLoadEntries(
        manifest.findByKind("model").concat(manifest.findByKind("vrm")),
        getMintModelPolicy,
        "model",
      ),
      colliders: this.createLoadEntries(manifest.findByKind("collider"), getMintColliderPolicy, "collider"),
      streaming: this.createLoadEntries(manifest.findByTag("streaming"), getMintStreamingPolicy, "streaming"),
    };
  }

  public async loadWith<TAsset>(
    loader: (entry: MintLoadPlanEntry<unknown>) => Promise<TAsset>,
  ): Promise<MintLoadResult<TAsset>[]> {
    const plan = this.createLoadPlan();
    const entries = [
      ...plan.splats,
      ...plan.models,
      ...plan.colliders,
      ...plan.streaming,
    ];

    const results: MintLoadResult<TAsset>[] = [];

    for (const entry of entries) {
      const loaded = await loader(entry);
      results.push({
        asset: entry.asset,
        kind: entry.kind,
        source: entry.source,
        loaded,
      });
    }

    return results;
  }

  public async loadRuntime<TAsset>(
    loaders: MintRuntimeLoaderMap<TAsset>,
  ): Promise<MintRuntimeLoadSummary<TAsset>> {
    const plan = this.createLoadPlan();
    const results: MintLoadResult<TAsset>[] = [];

    const groups = [plan.splats, plan.models, plan.colliders, plan.streaming];

    for (const group of groups) {
      for (const entry of group) {
        const loader = loaders[entry.kind];

        if (!loader) {
          continue;
        }

        const loaded = await loader.load(entry);
        results.push({
          asset: entry.asset,
          kind: entry.kind,
          source: entry.source,
          loaded: loaded as TAsset,
        });
      }
    }

    return {
      plan,
      results,
    };
  }

  public async loadThroughBridge<TAsset>(
    bridges: MintBridgeSet<TAsset>,
  ): Promise<MintRuntimeLoadSummary<TAsset>> {
    const plan = this.createLoadPlan();
    const results: MintLoadResult<TAsset>[] = [];

    const groups = [plan.splats, plan.models, plan.colliders, plan.streaming];

    for (const group of groups) {
      for (const entry of group) {
        const loaded = await this.loadBridgeEntry(bridges, entry);
        if (loaded === null) {
          continue;
        }
        results.push({
          asset: entry.asset,
          kind: entry.kind,
          source: entry.source,
          loaded,
        });
      }
    }

    return {
      plan,
      results,
    };
  }

  public async resolveAssetSource(idOrAlias: string): Promise<string | null> {
    const manifest = this.manifest ?? await this.loadManifest();
    const asset = manifest.getAsset(idOrAlias) ?? manifest.findByAlias(idOrAlias);

    if (!asset) {
      return manifest.fallback?.source ?? this.options.fallbackManifest?.fallback?.source ?? null;
    }

    if (this.options.provider.resolveAssetSource) {
      try {
        const resolved = await this.options.provider.resolveAssetSource(asset);

        if (typeof resolved === "string" && resolved.trim()) {
          return resolved.trim();
        }
      } catch {
        // Fall back to the manifest source below.
      }
    }

    return asset.source || (manifest.fallback?.source ?? this.options.fallbackManifest?.fallback?.source ?? null);
  }

  public registerLoaders(resourceManager?: ResourceManager): ResourceManager | null {
    const manager = resourceManager ?? this.options.resourceManager;

    if (!manager) {
      return null;
    }

    manager.registerLoader("mint-manifest", {
      load: async (source: string) => MintAssetManifest.fromJSON(JSON.parse(source)),
    });

    manager.registerLoader("mint-asset-manifest", {
      load: async (source: string) => MintAssetManifest.fromJSON(JSON.parse(source)),
    });

    return manager;
  }

  private getCurrentManifest(): MintAssetManifest {
    return this.manifest ?? this.options.fallbackManifest ?? MintAssetManifest.fromAssetManifest(new AssetManifest("mint-assets", "1.0", []));
  }

  private createLoadEntries<TPolicy>(
    assets: readonly AssetEntry[],
    policyGetter: (asset: AssetEntry) => TPolicy | null,
    kind: MintLoadPlan["splats"][number]["kind"],
  ): Array<MintLoadPlanEntry<TPolicy>> {
    return assets
      .map((asset) => ({ asset, policy: policyGetter(asset) }))
      .filter((entry): entry is { asset: AssetEntry; policy: TPolicy } => entry.policy !== null)
      .map((entry) => ({
        kind,
        asset: entry.asset,
        policy: entry.policy,
        source: entry.asset.source,
      }));
  }

  private async loadBridgeEntry<TAsset>(
    bridges: MintBridgeSet<TAsset>,
    entry: MintLoadPlan["splats"][number] | MintLoadPlan["models"][number] | MintLoadPlan["colliders"][number] | MintLoadPlan["streaming"][number],
  ): Promise<TAsset | null> {
    const context = toLoaderContext(entry as never);

    switch (entry.kind) {
      case "gaussian-splat":
        if (bridges.splat) {
          return bridges.splat.load(context as never);
        }
        break;
      case "model":
        if (bridges.model) {
          return bridges.model.load(context as never);
        }
        break;
      case "collider":
        if (bridges.collider) {
          return bridges.collider.load(context as never);
        }
        break;
      case "streaming":
        if (bridges.streaming) {
          return bridges.streaming.load(context as never);
        }
        break;
    }

    return null;
  }
}
