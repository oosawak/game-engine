export class Vector3 {
  public constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}

  public set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  public copy(value: Vector3): this {
    this.x = value.x;
    this.y = value.y;
    this.z = value.z;
    return this;
  }

  public clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  public add(value: Vector3): this {
    this.x += value.x;
    this.y += value.y;
    this.z += value.z;
    return this;
  }

  public sub(value: Vector3): this {
    this.x -= value.x;
    this.y -= value.y;
    this.z -= value.z;
    return this;
  }

  public multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  public divideScalar(scalar: number): this {
    if (scalar === 0) {
      throw new Error("Cannot divide a Vector3 by zero.");
    }

    return this.multiplyScalar(1 / scalar);
  }

  public length(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  public normalize(): this {
    const length = this.length();

    if (length === 0) {
      return this;
    }

    return this.divideScalar(length);
  }

  public dot(value: Vector3): number {
    return this.x * value.x + this.y * value.y + this.z * value.z;
  }

  public cross(value: Vector3): Vector3 {
    return new Vector3(
      this.y * value.z - this.z * value.y,
      this.z * value.x - this.x * value.z,
      this.x * value.y - this.y * value.x,
    );
  }

  public equals(value: Vector3): boolean {
    return this.x === value.x && this.y === value.y && this.z === value.z;
  }
}
