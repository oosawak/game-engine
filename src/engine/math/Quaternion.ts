export class Quaternion {
  public constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 1,
  ) {}

  public set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  public copy(value: Quaternion): this {
    this.x = value.x;
    this.y = value.y;
    this.z = value.z;
    this.w = value.w;
    return this;
  }

  public clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  public normalize(): this {
    const length = Math.hypot(this.x, this.y, this.z, this.w);

    if (length === 0) {
      return this.set(0, 0, 0, 1);
    }

    const inverse = 1 / length;
    this.x *= inverse;
    this.y *= inverse;
    this.z *= inverse;
    this.w *= inverse;
    return this;
  }

  public multiply(value: Quaternion): this {
    const ax = this.x;
    const ay = this.y;
    const az = this.z;
    const aw = this.w;
    const bx = value.x;
    const by = value.y;
    const bz = value.z;
    const bw = value.w;

    this.x = ax * bw + aw * bx + ay * bz - az * by;
    this.y = ay * bw + aw * by + az * bx - ax * bz;
    this.z = az * bw + aw * bz + ax * by - ay * bx;
    this.w = aw * bw - ax * bx - ay * by - az * bz;
    return this;
  }

  public setFromEuler(x: number, y: number, z: number): this {
    const halfX = x * 0.5;
    const halfY = y * 0.5;
    const halfZ = z * 0.5;

    const cx = Math.cos(halfX);
    const sx = Math.sin(halfX);
    const cy = Math.cos(halfY);
    const sy = Math.sin(halfY);
    const cz = Math.cos(halfZ);
    const sz = Math.sin(halfZ);

    this.x = sx * cy * cz + cx * sy * sz;
    this.y = cx * sy * cz - sx * cy * sz;
    this.z = cx * cy * sz + sx * sy * cz;
    this.w = cx * cy * cz - sx * sy * sz;
    return this;
  }
}
