export type AssetKind =
  | "data"
  | "image"
  | "audio"
  | "scene"
  | "script"
  | "sprite-animation"
  | "vrm"
  | "vrm-motion"
  | "splat"
  | "model"
  | "collider"
  | "streaming"
  | "prefab"
  | "unknown";

export interface AssetMeta {
  readonly [key: string]: string | number | boolean | readonly string[] | readonly number[] | null | undefined;
}

export interface AssetEntry {
  readonly id: string;
  readonly kind: AssetKind;
  readonly source: string;
  readonly alias: readonly string[];
  readonly scriptName: string;
  readonly tags: readonly string[];
  readonly meta: AssetMeta;
}

export interface AssetManifestData {
  readonly id: string;
  readonly version: string;
  readonly assets: readonly AssetEntry[];
}

export class AssetManifest {
  public constructor(
    public readonly id: string,
    public readonly version: string,
    public readonly assets: readonly AssetEntry[],
  ) {}

  public static fromJSON(value: unknown): AssetManifest {
    const data = normalizeManifestData(value);
    return new AssetManifest(data.id, data.version, data.assets);
  }

  public getAsset(id: string): AssetEntry | null {
    return this.assets.find((asset) => asset.id === id) ?? null;
  }

  public findByAlias(alias: string): AssetEntry | null {
    return this.assets.find((asset) => asset.alias.includes(alias)) ?? null;
  }

  public findByTag(tag: string): AssetEntry[] {
    return this.assets.filter((asset) => asset.tags.includes(tag));
  }

  public findByKind(kind: AssetKind): AssetEntry[] {
    return this.assets.filter((asset) => asset.kind === kind);
  }

  public toJSON(): AssetManifestData {
    return {
      id: this.id,
      version: this.version,
      assets: this.assets.map((asset) => ({
        ...asset,
        alias: [...asset.alias],
        tags: [...asset.tags],
      })),
    };
  }
}

function normalizeManifestData(value: unknown): AssetManifestData {
  const raw = (value ?? {}) as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "asset-manifest";
  const version = typeof raw.version === "string" && raw.version.trim() ? raw.version.trim() : "1.0";
  const assets = Array.isArray(raw.assets) ? raw.assets.map(normalizeAssetEntry).filter(Boolean) as AssetEntry[] : [];

  return {
    id,
    version,
    assets,
  };
}

function normalizeAssetEntry(value: unknown, index: number): AssetEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `asset-${index + 1}`;
  const kind = normalizeKind(raw.kind);
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

function normalizeMeta(value: unknown): AssetMeta {
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

function normalizeKind(value: unknown): AssetKind {
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
