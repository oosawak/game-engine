import { CameraComponent } from "../component/CameraComponent.js";
import { LightComponent } from "../component/LightComponent.js";
import type { GameObject } from "../object/GameObject.js";
import type { Scene } from "../scene/Scene.js";

export interface SceneRenderState {
  readonly scene: Scene;
  readonly cameraObject: GameObject;
  readonly camera: CameraComponent;
  readonly lights: readonly LightComponent[];
}

export function collectSceneRenderState(scene: Scene): SceneRenderState | null {
  const cameraObject = scene.getActiveCameraObject();
  const camera = cameraObject?.getComponent(CameraComponent) ?? null;

  if (!cameraObject || !camera) {
    return null;
  }

  const lights = scene
    .getObjects()
    .filter((gameObject) => gameObject.isActive && !gameObject.isDestroyed)
    .map((gameObject) => gameObject.getComponent(LightComponent))
    .filter((light): light is LightComponent => light !== null);

  return {
    scene,
    cameraObject,
    camera,
    lights,
  };
}
