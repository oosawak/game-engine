export interface MeshAttribute {
  readonly name: string;
  readonly data: Float32Array | Uint16Array | Uint32Array;
  readonly itemSize: number;
}

export class Mesh {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly attributes: readonly MeshAttribute[] = [],
    public readonly indices: Uint16Array | Uint32Array | null = null,
  ) {}

  public getAttribute(name: string): MeshAttribute | null {
    return this.attributes.find((attribute) => attribute.name === name) ?? null;
  }

  public hasAttribute(name: string): boolean {
    return this.getAttribute(name) !== null;
  }

  public getIndexCount(): number {
    return this.indices?.length ?? 0;
  }
}
