export interface MaterialUniforms {
  readonly [name: string]: number | boolean | string | readonly number[];
}

export class Material {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly shaderId: string,
    public readonly uniforms: MaterialUniforms = {},
  ) {}
}
