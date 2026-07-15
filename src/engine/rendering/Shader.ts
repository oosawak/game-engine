export interface ShaderSource {
  readonly vertex: string;
  readonly fragment: string;
}

export class Shader {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly source: ShaderSource,
  ) {}

  public isComplete(): boolean {
    return this.source.vertex.trim().length > 0 && this.source.fragment.trim().length > 0;
  }
}
