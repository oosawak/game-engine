import type { AssetEntry } from "../../engine/resource/AssetManifest.js";
import type {
  MintColliderPolicy,
  MintGaussianSplatPolicy,
  MintModelPolicy,
  MintStreamingPolicy,
} from "./MintAssetPolicy.js";
import type { MintLoadPlanEntry, MintLoadPlanKind } from "./MintLoadPlan.js";

export interface MintLoaderBridgeContext<TPolicy> {
  readonly asset: AssetEntry;
  readonly kind: MintLoadPlanKind;
  readonly source: string;
  readonly policy: TPolicy;
}

export interface MintGaussianSplatBridge<TAsset = unknown> {
  load(context: MintLoaderBridgeContext<MintGaussianSplatPolicy>): Promise<TAsset>;
}

export interface MintModelBridge<TAsset = unknown> {
  load(context: MintLoaderBridgeContext<MintModelPolicy>): Promise<TAsset>;
}

export interface MintColliderBridge<TAsset = unknown> {
  load(context: MintLoaderBridgeContext<MintColliderPolicy>): Promise<TAsset>;
}

export interface MintStreamingBridge<TAsset = unknown> {
  load(context: MintLoaderBridgeContext<MintStreamingPolicy>): Promise<TAsset>;
}

export interface MintBridgeSet<TAsset = unknown> {
  readonly splat?: MintGaussianSplatBridge<TAsset>;
  readonly model?: MintModelBridge<TAsset>;
  readonly collider?: MintColliderBridge<TAsset>;
  readonly streaming?: MintStreamingBridge<TAsset>;
}

export function toLoaderContext<TPolicy>(
  entry: MintLoadPlanEntry<TPolicy>,
): MintLoaderBridgeContext<TPolicy> {
  return {
    asset: entry.asset,
    kind: entry.kind,
    source: entry.source,
    policy: entry.policy,
  };
}

