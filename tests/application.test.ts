import { describe, expect, it } from "vitest";
import { Game } from "../src/application/Game.js";
import { MainScene } from "../src/application/MainScene.js";
import { Scene } from "../src/engine/scene/Scene.js";
import { MovingObjectComponent } from "../src/application/MovingObjectComponent.js";

describe("Application layer", () => {
  it("creates a configured main scene", () => {
    const scene = MainScene.create();

    expect(scene).toBeInstanceOf(Scene);
    expect(scene.name).toBe("MainScene");
    expect(scene.getObjects().length).toBeGreaterThanOrEqual(3);
  });

  it("bootstraps a game with the main scene registered", () => {
    const game = new Game({
      loop: {
        requestFrame: () => 1,
        cancelFrame: () => undefined,
        now: () => 0,
      },
    });

    expect(game.getEngine().getSceneManager().getCurrentScene()?.name).toBe("MainScene");
    expect(
      game.getEngine()
        .getSceneManager()
        .getCurrentScene()
        ?.getObjects()
        .some((object) => object.getComponent(MovingObjectComponent) !== null),
    ).toBe(true);
  });
});
