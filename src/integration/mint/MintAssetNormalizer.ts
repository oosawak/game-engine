import type { AssetEntry, AssetKind } from "../../engine/resource/AssetManifest.js";
import type { MintAssetManifestData, MintFallbackData } from "./MintAssetManifest.js";

export function normalizeMintAssetManifestData(value: unknown): MintAssetManifestData {
  const raw = (value ?? {}) as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "mint-assets";
  const version = typeof raw.version === "string" && raw.version.trim() ? raw.version.trim() : "1.0";
  const provider = typeof raw.provider === "string" && raw.provider.trim() ? raw.provider.trim() : "Mint MCP";
  const client = typeof raw.client === "string" && raw.client.trim() ? raw.client.trim() : "mint-threejs-skills";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const assets = Array.isArray(raw.assets) ? raw.assets.map(normalizeAssetEntry).filter(Boolean) as AssetEntry[] : [];
  const fallback = normalizeMintFallbackData(raw.fallback, id);

  return {
    id,
    version,
    provider,
    client,
    description,
    assets,
    fallback,
  };
}

export function normalizeMintFallbackData(value: unknown, manifestId: string): MintFallbackData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const assetId = typeof raw.assetId === "string" && raw.assetId.trim() ? raw.assetId.trim() : "";
  const source = typeof raw.source === "string" && raw.source.trim() ? raw.source.trim() : "";
  const reason = typeof raw.reason === "string" && raw.reason.trim() ? raw.reason.trim() : "";
  const kind = normalizeAssetKind(raw.kind);
  const fallbackManifestId = typeof raw.manifestId === "string" && raw.manifestId.trim()
    ? raw.manifestId.trim()
    : manifestId;

  if (!assetId || !source) {
    return null;
  }

  return {
    manifestId: fallbackManifestId,
    assetId,
    kind,
    source,
    reason,
  };
}

function normalizeAssetEntry(value: unknown, index: number): AssetEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `asset-${index + 1}`;
  const kind = normalizeAssetKind(raw.kind);
  const source = typeof raw.source === "string" && raw.source.trim() ? raw.source.trim() : "";
  const alias = normalizeStringArray(raw.alias);
  const scriptName = typeof raw.scriptName === "string" && raw.scriptName.trim()
    ? raw.scriptName.trim()
    : id;
  const tags = normalizeStringArray(raw.tags);
  const meta = normalizeMeta(raw.meta);

  if (!source) {
    return null;
  }

  return {
    id,
    kind,
    source,
    alias,
    scriptName,
    tags,
    meta,
  };
}

function normalizeStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeMeta(value: unknown): AssetEntry["meta"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const meta: Record<string, string | number | boolean | readonly string[] | readonly number[] | null | undefined> = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean" ||
      entry === null
    ) {
      meta[key] = entry;
      continue;
    }

    if (Array.isArray(entry) && entry.every((item) => typeof item === "string")) {
      meta[key] = entry.slice() as string[];
      continue;
    }

    if (Array.isArray(entry) && entry.every((item) => typeof item === "number")) {
      meta[key] = entry.slice() as number[];
    }
  }

  return meta;
}

function normalizeAssetKind(value: unknown): AssetKind {
  if (typeof value !== "string") {
    return "unknown";
  }

  const normalized = value.trim() as AssetKind;
  const allowed: AssetKind[] = [
    "data",
    "image",
    "audio",
    "scene",
    "script",
    "sprite-animation",
    "vrm",
    "vrm-motion",
    "splat",
    "model",
    "collider",
    "streaming",
    "prefab",
    "unknown",
  ];

  return allowed.includes(normalized) ? normalized : "unknown";
}
