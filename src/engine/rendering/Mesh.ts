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
}
