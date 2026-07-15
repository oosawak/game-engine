import type { GameObject } from "../object/GameObject.js";

const componentOwners = new WeakMap<Component, GameObject | null>();

export abstract class Component {
  private _started = false;
  private _destroyed = false;

  public enabled = true;

  public get owner(): GameObject | null {
    return componentOwners.get(this) ?? null;
  }

  public get isStarted(): boolean {
    return this._started;
  }

  public get isDestroyed(): boolean {
    return this._destroyed;
  }

  public internalStart(): void {
    if (!this.enabled || this._started || this._destroyed) {
      return;
    }

    this._started = true;
    this.start();
  }

  public internalUpdate(deltaTime: number): void {
    if (!this.enabled || !this._started || this._destroyed) {
      return;
    }

    this.update(deltaTime);
  }

  public internalRender(): void {
    if (!this.enabled || !this._started || this._destroyed) {
      return;
    }

    this.render();
  }

  public internalDestroy(): void {
    if (this._destroyed) {
      return;
    }

    this._destroyed = true;
    this.destroy();
  }

  protected start(): void {}

  protected update(_deltaTime: number): void {}

  protected render(): void {}

  protected destroy(): void {}
}

export function attachComponentOwner(component: Component, owner: GameObject | null): void {
  componentOwners.set(component, owner);
}
