export class Vector2 {
  public constructor(
    public x = 0,
    public y = 0,
  ) {}

  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public copy(value: Vector2): this {
    this.x = value.x;
    this.y = value.y;
    return this;
  }

  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  public add(value: Vector2): this {
    this.x += value.x;
    this.y += value.y;
    return this;
  }

  public sub(value: Vector2): this {
    this.x -= value.x;
    this.y -= value.y;
    return this;
  }

  public multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  public length(): number {
    return Math.hypot(this.x, this.y);
  }

  public normalize(): this {
    const length = this.length();

    if (length === 0) {
      return this;
    }

    return this.multiplyScalar(1 / length);
  }
}
