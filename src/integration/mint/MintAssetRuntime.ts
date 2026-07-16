import type { MintLoadPlan, MintLoadPlanEntry, MintLoadResult } from "./MintLoadPlan.js";

export interface MintRuntimeLoader<TAsset = unknown> {
  readonly kind: MintLoadPlanEntry<unknown>["kind"];
  load(entry: MintLoadPlanEntry<unknown>): Promise<TAsset>;
}

export type MintRuntimeLoaderMap<TAsset = unknown> = Partial<
  Record<MintLoadPlanEntry<unknown>["kind"], MintRuntimeLoader<TAsset>>
>;

export interface MintRuntimeLoadSummary<TAsset = unknown> {
  readonly plan: MintLoadPlan;
  readonly results: readonly MintLoadResult<TAsset>[];
}

export function createMintRuntimeLoaderMap(
  loaders: readonly MintRuntimeLoader<unknown>[],
): MintRuntimeLoaderMap {
  return loaders.reduce<MintRuntimeLoaderMap>((map, loader) => {
    map[loader.kind] = loader;
    return map;
  }, {});
}
