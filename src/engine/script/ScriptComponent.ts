import { Component } from "../component/Component.js";
import type { GameObject } from "../object/GameObject.js";

export interface ScriptContext {
  readonly owner: GameObject;
  readonly component: ScriptComponent;
}

export interface ScriptLifecycle {
  start?(context: ScriptContext): void;
  update?(context: ScriptContext, deltaTime: number): void;
  render?(context: ScriptContext): void;
  destroy?(context: ScriptContext): void;
}

export class ScriptComponent extends Component {
  private script: ScriptLifecycle | null;

  public constructor(script: ScriptLifecycle | null = null) {
    super();
    this.script = script;
  }

  public setScript(script: ScriptLifecycle | null): void {
    this.script = script;
  }

  public getScript(): ScriptLifecycle | null {
    return this.script;
  }

  protected override start(): void {
    const script = this.script;
    script?.start?.(this.createContext());
  }

  protected override update(deltaTime: number): void {
    const script = this.script;
    script?.update?.(this.createContext(), deltaTime);
  }

  protected override render(): void {
    const script = this.script;
    script?.render?.(this.createContext());
  }

  protected override destroy(): void {
    const script = this.script;
    script?.destroy?.(this.createContext());
  }

  private createContext(): ScriptContext {
    const owner = this.owner;

    if (!owner) {
      throw new Error("ScriptComponent requires an owner before lifecycle execution.");
    }

    return {
      owner,
      component: this,
    };
  }
}
