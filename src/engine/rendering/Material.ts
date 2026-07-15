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

  public getUniform(name: string): number | boolean | string | readonly number[] | null {
    return Object.prototype.hasOwnProperty.call(this.uniforms, name)
      ? this.uniforms[name]
      : null;
  }

  public hasUniform(name: string): boolean {
    return this.getUniform(name) !== null;
  }
}
