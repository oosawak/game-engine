import { Scene } from "./Scene.js";

export class SceneManager {
  private readonly scenes = new Map<string, Scene>();
  private currentScene: Scene | null = null;

  public addScene(scene: Scene): void {
    if (this.scenes.has(scene.name)) {
      throw new Error(`Scene "${scene.name}" is already registered.`);
    }

    this.scenes.set(scene.name, scene);
  }

  public removeScene(name: string): boolean {
    const scene = this.scenes.get(name);

    if (!scene) {
      return false;
    }

    if (this.currentScene === scene) {
      this.currentScene.exit();
      this.currentScene = null;
    }

    return this.scenes.delete(name);
  }

  public changeScene(name: string): void {
    const nextScene = this.scenes.get(name);

    if (!nextScene) {
      throw new Error(`Scene "${name}" was not found.`);
    }

    this.currentScene?.exit();
    this.currentScene = nextScene;
    this.currentScene.enter();
  }

  public update(deltaTime: number): void {
    this.currentScene?.update(deltaTime);
  }

  public render(deltaTime = 0, frame = 0): void {
    this.currentScene?.render(deltaTime, frame);
  }

  public getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  public getScene(name: string): Scene | null {
    return this.scenes.get(name) ?? null;
  }
}
