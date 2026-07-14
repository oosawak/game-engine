import { Component } from "./Component.js";
import { Matrix4 } from "../math/Matrix4.js";
import { Quaternion } from "../math/Quaternion.js";
import { Vector3 } from "../math/Vector3.js";

const DEG_TO_RAD = Math.PI / 180;

export class Transform extends Component {
  public readonly position = new Vector3();
  public readonly rotation = new Vector3();
  public readonly scale = new Vector3(1, 1, 1);

  public translate(x: number, y: number, z: number): void {
    this.position.x += x;
    this.position.y += y;
    this.position.z += z;
  }

  public rotate(x: number, y: number, z: number): void {
    this.rotation.x += x;
    this.rotation.y += y;
    this.rotation.z += z;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  public setRotation(x: number, y: number, z: number): void {
    this.rotation.set(x, y, z);
  }

  public setScale(x: number, y: number, z: number): void {
    this.scale.set(x, y, z);
  }

  public reset(): void {
    this.position.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.scale.set(1, 1, 1);
  }

  public toMatrix4(): Matrix4 {
    const rotation = new Quaternion().setFromEuler(
      this.rotation.x * DEG_TO_RAD,
      this.rotation.y * DEG_TO_RAD,
      this.rotation.z * DEG_TO_RAD,
    );

    return new Matrix4().compose(this.position, rotation, this.scale);
  }
}
