import type { GameObject } from "../object/GameObject.js";
import type { Scene } from "../scene/Scene.js";
import type { CameraComponent } from "../component/CameraComponent.js";
import type { LightComponent } from "../component/LightComponent.js";

export interface RenderViewport {
  readonly width: number;
  readonly height: number;
}

export interface RenderContext {
  readonly scene: Scene | null;
  readonly cameraObject: GameObject | null;
  readonly camera: CameraComponent | null;
  readonly lights: readonly LightComponent[];
  readonly activeObject: GameObject | null;
  readonly deltaTime: number;
  readonly frame: number;
  readonly viewport?: RenderViewport;
}
