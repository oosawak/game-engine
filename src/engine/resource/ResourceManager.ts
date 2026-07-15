import type { ResourceLoader } from "./ResourceLoader.js";

export class ResourceManager {
  private readonly loaders = new Map<string, ResourceLoader<unknown>>();
  private readonly cache = new Map<string, unknown>();

  public registerLoader<TResource>(type: string, loader: ResourceLoader<TResource>): void {
    this.loaders.set(type, loader);
  }

  public hasLoader(type: string): boolean {
    return this.loaders.has(type);
  }

  public async load<TResource>(type: string, id: string, source: string): Promise<TResource> {
    const cacheKey = this.createCacheKey(type, id);
    const cached = this.cache.get(cacheKey);

    if (cached !== undefined) {
      return cached as TResource;
    }

    const loader = this.loaders.get(type);

    if (!loader) {
      throw new Error(`No resource loader registered for type "${type}".`);
    }

    const resource = await loader.load(source);
    this.cache.set(cacheKey, resource);
    return resource as TResource;
  }

  public get<TResource>(type: string, id: string): TResource | null {
    const cacheKey = this.createCacheKey(type, id);
    return (this.cache.get(cacheKey) as TResource | undefined) ?? null;
  }

  public clear(): void {
    this.cache.clear();
  }

  private createCacheKey(type: string, id: string): string {
    return `${type}:${id}`;
  }
}
