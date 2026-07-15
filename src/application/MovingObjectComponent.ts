import { Component } from "../engine/component/Component.js";

export class MovingObjectComponent extends Component {
  private readonly speed: number;
  private phase = 0;

  public constructor(speed = 1) {
    super();
    this.speed = speed;
  }

  protected override update(deltaTime: number): void {
    const owner = this.owner;

    if (!owner) {
      return;
    }

    this.phase += deltaTime * this.speed;
    owner.transform.rotate(0, this.speed * deltaTime * 45, 0);
    owner.transform.translate(Math.sin(this.phase) * 0.02, 0, Math.cos(this.phase) * 0.01);
  }
}
