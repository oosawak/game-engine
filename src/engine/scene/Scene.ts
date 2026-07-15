import { CameraComponent } from "../component/CameraComponent.js";
import { GameObject } from "../object/GameObject.js";
import { collectSceneRenderState } from "../rendering/SceneRenderState.js";
import type { RenderContext } from "../rendering/RenderContext.js";

export class Scene {
  private readonly objects = new Map<string, GameObject>();
  private active = false;

  public constructor(public readonly name: string) {}

  public get isActive(): boolean {
    return this.active;
  }

  public enter(): void {
    this.active = true;

    for (const gameObject of this.objects.values()) {
      gameObject.activate();
    }
  }

  public exit(): void {
    this.active = false;

    for (const gameObject of this.objects.values()) {
      gameObject.deactivate();
    }
  }

  public addObject(gameObject: GameObject): void {
    if (this.objects.has(gameObject.id)) {
      throw new Error(`GameObject "${gameObject.id}" is already registered.`);
    }

    this.objects.set(gameObject.id, gameObject);

    if (this.active) {
      gameObject.activate();
    }
  }

  public getObject(id: string): GameObject | null {
    return this.objects.get(id) ?? null;
  }

  public getActiveCameraObject(): GameObject | null {
    for (const gameObject of this.objects.values()) {
      if (!gameObject.isActive || gameObject.isDestroyed) {
        continue;
      }

      if (gameObject.getComponent(CameraComponent)) {
        return gameObject;
      }
    }

    return null;
  }

  public removeObject(id: string): boolean {
    const gameObject = this.objects.get(id);

    if (!gameObject) {
      return false;
    }

    gameObject.destroy();
    return this.objects.delete(id);
  }

  public update(deltaTime: number): void {
    if (!this.active) {
      return;
    }

    for (const gameObject of this.objects.values()) {
      gameObject.update(deltaTime);
    }
  }

  public render(deltaTime = 0, frame = 0): void {
    if (!this.active) {
      return;
    }

    const sceneRenderState = collectSceneRenderState(this);
    if (!sceneRenderState) {
      return;
    }

    for (const gameObject of this.objects.values()) {
      gameObject.render({
        ...sceneRenderState,
        activeObject: gameObject,
        deltaTime,
        frame,
      } satisfies RenderContext);
    }
  }

  public getObjects(): readonly GameObject[] {
    return [...this.objects.values()];
  }
}
