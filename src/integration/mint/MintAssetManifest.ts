import { AssetManifest, type AssetEntry, type AssetKind } from "../../engine/resource/AssetManifest.js";
import { normalizeMintAssetManifestData } from "./MintAssetNormalizer.js";

export interface MintFallbackData {
  readonly manifestId: string;
  readonly assetId: string;
  readonly kind: AssetKind;
  readonly source: string;
  readonly reason: string;
}

export interface MintAssetManifestData {
  readonly id: string;
  readonly version: string;
  readonly provider: string;
  readonly client: string;
  readonly description: string;
  readonly assets: readonly AssetEntry[];
  readonly fallback: MintFallbackData | null;
}

export interface MintAssetManifestOptions {
  readonly provider?: string;
  readonly client?: string;
  readonly description?: string;
  readonly fallback?: MintFallbackData | null;
}

export class MintAssetManifest {
  public constructor(
    public readonly id: string,
    public readonly version: string,
    public readonly provider: string,
    public readonly client: string,
    public readonly description: string,
    public readonly manifest: AssetManifest,
    public readonly fallback: MintFallbackData | null,
  ) {}

  public static fromJSON(value: unknown): MintAssetManifest {
    const data = normalizeMintAssetManifestData(value);

    return new MintAssetManifest(
      data.id,
      data.version,
      data.provider,
      data.client,
      data.description,
      new AssetManifest(data.id, data.version, data.assets),
      data.fallback,
    );
  }

  public static fromAssetManifest(
    manifest: AssetManifest,
    options: MintAssetManifestOptions = {},
  ): MintAssetManifest {
    return new MintAssetManifest(
      manifest.id,
      manifest.version,
      options.provider ?? "Mint MCP",
      options.client ?? "mint-threejs-skills",
      options.description ?? "",
      manifest,
      options.fallback ?? null,
    );
  }

  public get assets(): readonly AssetEntry[] {
    return this.manifest.assets;
  }

  public getAsset(id: string): AssetEntry | null {
    return this.manifest.getAsset(id);
  }

  public findByAlias(alias: string): AssetEntry | null {
    return this.manifest.findByAlias(alias);
  }

  public findByTag(tag: string): AssetEntry[] {
    return this.manifest.findByTag(tag);
  }

  public findByKind(kind: AssetKind): AssetEntry[] {
    return this.manifest.findByKind(kind);
  }

  public toAssetManifest(): AssetManifest {
    return this.manifest;
  }

  public toJSON(): MintAssetManifestData {
    return {
      id: this.id,
      version: this.version,
      provider: this.provider,
      client: this.client,
      description: this.description,
      assets: this.manifest.assets.map((asset) => ({
        ...asset,
        alias: [...asset.alias],
        tags: [...asset.tags],
      })),
      fallback: this.fallback,
    };
  }
}
