import { describe, expect, it } from "vitest";
import { Engine } from "../src/engine/core/Engine.js";
import { Scene } from "../src/engine/scene/Scene.js";
import { SceneManager } from "../src/engine/scene/SceneManager.js";
import { GameObject } from "../src/engine/object/GameObject.js";
import { CameraComponent } from "../src/engine/component/CameraComponent.js";
import { LightComponent } from "../src/engine/component/LightComponent.js";
import { RendererComponent } from "../src/engine/rendering/RendererComponent.js";
import type { RenderContext } from "../src/engine/rendering/RenderContext.js";
import { collectSceneRenderState } from "../src/engine/rendering/SceneRenderState.js";

describe("Scene system", () => {
  it("switches scenes and updates active objects", () => {
    const manager = new SceneManager();
    const sceneA = new Scene("A");
    const sceneB = new Scene("B");
    const object = new GameObject("Cube");

    sceneA.addObject(object);
    manager.addScene(sceneA);
    manager.addScene(sceneB);
    manager.changeScene("A");
    manager.update(0.016);

    expect(sceneA.isActive).toBe(true);
    expect(manager.getCurrentScene()).toBe(sceneA);

    manager.changeScene("B");

    expect(sceneA.isActive).toBe(false);
    expect(sceneB.isActive).toBe(true);
  });

  it("ticks engine manually", () => {
    const engine = new Engine();
    const scene = new Scene("Main");
    engine.getSceneManager().addScene(scene);
    engine.getSceneManager().changeScene("Main");

    expect(engine.tick(1000)).toBeGreaterThanOrEqual(0);
  });

  it("renders through an active camera and exposes lights in the context", () => {
    const scene = new Scene("RenderScene");
    const calls: RenderContext[] = [];

    const camera = new GameObject("Camera");
    camera.addComponent(new CameraComponent());

    const light = new GameObject("Light");
    light.addComponent(new LightComponent({ intensity: 2 }));

    const cube = new GameObject("Cube");
    cube.addComponent(new RendererComponent({
      render: (context) => {
        calls.push(context);
      },
    }));

    scene.addObject(camera);
    scene.addObject(light);
    scene.addObject(cube);
    scene.enter();
    scene.render(0.016, 3);

    expect(calls).toHaveLength(1);
    expect(calls[0].scene).toBe(scene);
    expect(calls[0].cameraObject).toBe(camera);
    expect(calls[0].camera).toBeInstanceOf(CameraComponent);
    expect(calls[0].lights).toHaveLength(1);
    expect(calls[0].activeObject).toBe(cube);
  });

  it("collects render state outside of scene logic", () => {
    const scene = new Scene("Collect");
    const camera = new GameObject("Camera");
    camera.addComponent(new CameraComponent());
    const light = new GameObject("Light");
    light.addComponent(new LightComponent());

    scene.addObject(camera);
    scene.addObject(light);
    scene.enter();

    const state = collectSceneRenderState(scene);

    expect(state?.scene).toBe(scene);
    expect(state?.cameraObject).toBe(camera);
    expect(state?.camera).toBeInstanceOf(CameraComponent);
    expect(state?.lights).toHaveLength(1);
  });
});
