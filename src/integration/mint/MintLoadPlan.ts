import type { AssetEntry } from "../../engine/resource/AssetManifest.js";
import type { MintColliderPolicy, MintGaussianSplatPolicy, MintModelPolicy, MintStreamingPolicy } from "./MintAssetPolicy.js";

export type MintLoadPlanKind = "gaussian-splat" | "model" | "collider" | "streaming";

export interface MintLoadPlanEntry<TPolicy> {
  readonly kind: MintLoadPlanKind;
  readonly asset: AssetEntry;
  readonly policy: TPolicy;
  readonly source: string;
}

export interface MintLoadPlan {
  readonly splats: readonly MintLoadPlanEntry<MintGaussianSplatPolicy>[];
  readonly models: readonly MintLoadPlanEntry<MintModelPolicy>[];
  readonly colliders: readonly MintLoadPlanEntry<MintColliderPolicy>[];
  readonly streaming: readonly MintLoadPlanEntry<MintStreamingPolicy>[];
}

export interface MintAssetLoader<TPolicy> {
  readonly kind: MintLoadPlanKind;
  load(entry: MintLoadPlanEntry<TPolicy>): Promise<unknown>;
}

export interface MintLoadResult<TAsset = unknown> {
  readonly asset: AssetEntry;
  readonly kind: MintLoadPlanKind;
  readonly source: string;
  readonly loaded: TAsset;
}
