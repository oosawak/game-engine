import type { AssetEntry } from "../../engine/resource/AssetManifest.js";

export interface MintAssetProvider {
  readonly providerName: string;

  loadManifest(): Promise<unknown>;

  loadFallbackManifest?(): Promise<unknown | null>;

  resolveAssetSource?(asset: AssetEntry): Promise<string | null>;
}
