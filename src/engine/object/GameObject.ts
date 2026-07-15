import { Component, attachComponentOwner } from "../component/Component.js";
import { Transform } from "../component/Transform.js";
import type { RenderContext } from "../rendering/RenderContext.js";

let nextGameObjectId = 1;

export class GameObject {
  public readonly id: string;
  public readonly transform: Transform;

  private readonly components: Component[] = [];
  private readonly children: GameObject[] = [];
  private parent: GameObject | null = null;
  private active = false;
  private destroyed = false;

  public constructor(public name: string) {
    this.id = `game-object-${nextGameObjectId++}`;
    this.transform = new Transform();
    this.attachComponent(this.transform);
  }

  public get isActive(): boolean {
    return this.active;
  }

  public get isDestroyed(): boolean {
    return this.destroyed;
  }

  public get parentObject(): GameObject | null {
    return this.parent;
  }

  public addComponent<T extends Component>(component: T): T {
    if (component.owner !== null) {
      throw new Error("Component already has an owner.");
    }

    this.attachComponent(component);

    if (this.active) {
      component.internalStart();
    }

    return component;
  }

  public getComponent<T extends Component>(
    componentType: new (...args: any[]) => T,
  ): T | null {
    for (const component of this.components) {
      if (component instanceof componentType) {
        return component;
      }
    }

    return null;
  }

  public removeComponent(component: Component): boolean {
    if (component === this.transform) {
      throw new Error("Transform cannot be removed.");
    }

    const index = this.components.indexOf(component);

    if (index === -1) {
      return false;
    }

    component.internalDestroy();
    attachComponentOwner(component, null);
    this.components.splice(index, 1);
    return true;
  }

  public addChild(child: GameObject): void {
    if (child === this) {
      throw new Error("A GameObject cannot be its own child.");
    }

    child.parent?.removeChild(child);
    child.parent = this;
    this.children.push(child);

    if (this.active) {
      child.activate();
    }
  }

  public removeChild(child: GameObject): boolean {
    const index = this.children.indexOf(child);

    if (index === -1) {
      return false;
    }

    child.parent = null;
    this.children.splice(index, 1);
    return true;
  }

  public getChildren(): readonly GameObject[] {
    return this.children;
  }

  public activate(): void {
    if (this.active || this.destroyed) {
      return;
    }

    this.active = true;

    for (const component of this.components) {
      component.internalStart();
    }

    for (const child of this.children) {
      child.activate();
    }
  }

  public deactivate(): void {
    if (!this.active) {
      return;
    }

    this.active = false;

    for (const child of this.children) {
      child.deactivate();
    }
  }

  public update(deltaTime: number): void {
    if (!this.active || this.destroyed) {
      return;
    }

    for (const component of this.components) {
      component.internalUpdate(deltaTime);
    }

    for (const child of this.children) {
      child.update(deltaTime);
    }
  }

  public render(context?: RenderContext): void {
    if (!this.active || this.destroyed) {
      return;
    }

    for (const component of this.components) {
      component.internalRender(context);
    }

    for (const child of this.children) {
      child.render(context);
    }
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.active = false;

    for (const child of [...this.children]) {
      child.destroy();
    }

    for (const component of [...this.components]) {
      component.internalDestroy();
      attachComponentOwner(component, null);
    }

    this.components.length = 0;
    this.children.length = 0;
    this.parent?.removeChild(this);
    this.parent = null;
  }

  private attachComponent(component: Component): void {
    attachComponentOwner(component, this);
    this.components.push(component);
  }
}
