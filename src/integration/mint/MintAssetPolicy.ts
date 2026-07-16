import type { AssetEntry } from "../../engine/resource/AssetManifest.js";

export interface MintGaussianSplatPolicy {
  readonly format: "gaussian-splat";
  readonly streaming: boolean;
  readonly scale: number | null;
  readonly fallbackSource: string | null;
}

export interface MintModelPolicy {
  readonly format: "gltf" | "glb" | "vrm" | "fbx" | "unknown";
  readonly colliders: boolean;
  readonly rigged: boolean;
  readonly fallbackSource: string | null;
}

export interface MintColliderPolicy {
  readonly shape: "box" | "sphere" | "capsule" | "mesh" | "unknown";
  readonly layer: string | null;
  readonly trigger: boolean;
  readonly source: string | null;
}

export interface MintStreamingPolicy {
  readonly enabled: boolean;
  readonly url: string | null;
  readonly chunkSize: number | null;
  readonly priority: number | null;
}

export function getMintGaussianSplatPolicy(asset: AssetEntry): MintGaussianSplatPolicy | null {
  if (asset.kind !== "splat") {
    return null;
  }

  const meta = asset.meta;

  return {
    format: "gaussian-splat",
    streaming: readBoolean(meta.streaming, true),
    scale: readNumber(meta.scale),
    fallbackSource: readString(meta.fallbackSource) ?? null,
  };
}

export function getMintModelPolicy(asset: AssetEntry): MintModelPolicy | null {
  if (asset.kind !== "model" && asset.kind !== "vrm" && asset.kind !== "prefab") {
    return null;
  }

  const meta = asset.meta;
  const format = normalizeModelFormat(readString(meta.format));

  return {
    format,
    colliders: readBoolean(meta.colliders, false),
    rigged: readBoolean(meta.rigged, false),
    fallbackSource: readString(meta.fallbackSource) ?? null,
  };
}

export function getMintColliderPolicy(asset: AssetEntry): MintColliderPolicy | null {
  const source = readString(asset.meta.colliderSource) ?? readString(asset.meta.source) ?? null;
  const shape = normalizeColliderShape(readString(asset.meta.shape));

  if (!source && asset.kind !== "collider") {
    return null;
  }

  return {
    shape,
    layer: readString(asset.meta.layer) ?? null,
    trigger: readBoolean(asset.meta.trigger, false),
    source,
  };
}

export function getMintStreamingPolicy(asset: AssetEntry): MintStreamingPolicy | null {
  const enabled = readBoolean(asset.meta.streaming, false);
  const url = readString(asset.meta.streamingUrl) ?? readString(asset.meta.streamUrl) ?? null;
  const chunkSize = readNumber(asset.meta.chunkSize);
  const priority = readNumber(asset.meta.priority);

  if (!enabled && !url) {
    return null;
  }

  return {
    enabled,
    url,
    chunkSize,
    priority,
  };
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeModelFormat(value: string | null): MintModelPolicy["format"] {
  switch (value) {
    case "gltf":
    case "glb":
    case "vrm":
    case "fbx":
      return value;
    default:
      return "unknown";
  }
}

function normalizeColliderShape(value: string | null): MintColliderPolicy["shape"] {
  switch (value) {
    case "box":
    case "sphere":
    case "capsule":
    case "mesh":
      return value;
    default:
      return "unknown";
  }
}
