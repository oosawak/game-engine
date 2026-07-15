import { describe, expect, it } from "vitest";
import { RendererComponent } from "../src/engine/rendering/RendererComponent.js";
import type { RenderContext } from "../src/engine/rendering/RenderContext.js";
import type { Renderer } from "../src/engine/rendering/Renderer.js";
import { GameObject } from "../src/engine/object/GameObject.js";
import { CameraComponent } from "../src/engine/component/CameraComponent.js";
import { Scene } from "../src/engine/scene/Scene.js";

describe("Rendering boundary", () => {
  it("calls the assigned renderer with a render context", () => {
    const calls: RenderContext[] = [];
    const renderer: Renderer = {
      render: (context) => {
        calls.push(context);
      },
    };

    const context: RenderContext = {
      scene: new Scene("Main"),
      cameraObject: new GameObject("Camera"),
      camera: new CameraComponent(),
      lights: [],
      activeObject: null,
      deltaTime: 0.016,
      frame: 1,
      viewport: { width: 1280, height: 720 },
    };

    const object = new GameObject("Cube");
    object.addComponent(new RendererComponent(renderer, context));
    object.activate();
    object.render();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe(context);
  });
});
