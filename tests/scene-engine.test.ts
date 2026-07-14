import { describe, expect, it } from "vitest";
import { Engine } from "../src/engine/core/Engine.js";
import { Scene } from "../src/engine/scene/Scene.js";
import { SceneManager } from "../src/engine/scene/SceneManager.js";
import { GameObject } from "../src/engine/object/GameObject.js";

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
});
