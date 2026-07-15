export interface ResourceLoader<TResource> {
  load(source: string): Promise<TResource>;
}
