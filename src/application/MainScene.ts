import { CameraComponent } from "../engine/component/CameraComponent.js";
import { LightComponent } from "../engine/component/LightComponent.js";
import { GameObject } from "../engine/object/GameObject.js";
import { Scene } from "../engine/scene/Scene.js";
import { MovingObjectComponent } from "./MovingObjectComponent.js";

export class MainScene {
  public static create(): Scene {
    const scene = new Scene("MainScene");

    const cube = new GameObject("Cube");
    cube.addComponent(new MovingObjectComponent(1));

    const camera = new GameObject("MainCamera");
    camera.transform.setPosition(0, 2, 6);
    camera.addComponent(new CameraComponent({
      followTarget: cube,
    }));

    const light = new GameObject("DirectionalLight");
    light.addComponent(new LightComponent({
      type: "directional",
      intensity: 1.25,
      castShadow: true,
    }));

    scene.addObject(cube);
    scene.addObject(camera);
    scene.addObject(light);

    return scene;
  }
}
