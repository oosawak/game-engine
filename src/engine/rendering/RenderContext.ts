import type { GameObject } from "../object/GameObject.js";
import type { Scene } from "../scene/Scene.js";

export interface RenderViewport {
  readonly width: number;
  readonly height: number;
}

export interface RenderContext {
  readonly scene: Scene | null;
  readonly activeObject: GameObject | null;
  readonly deltaTime: number;
  readonly frame: number;
  readonly viewport?: RenderViewport;
}
