import { describe, expect, it } from "vitest";
import { CameraComponent } from "../src/engine/component/CameraComponent.js";
import { LightComponent } from "../src/engine/component/LightComponent.js";
import { GameObject } from "../src/engine/object/GameObject.js";

describe("Camera and light components", () => {
  it("stores camera view settings and follow target", () => {
    const cameraObject = new GameObject("Camera");
    const target = new GameObject("Target");
    const camera = new CameraComponent({
      fieldOfView: 75,
      near: 0.5,
      far: 500,
      zoom: 2,
      followTarget: target,
    });

    cameraObject.addComponent(camera);

    expect(camera.getProjection()).toBe("perspective");
    expect(camera.getFieldOfView()).toBe(75);
    expect(camera.getNear()).toBe(0.5);
    expect(camera.getFar()).toBe(500);
    expect(camera.getZoom()).toBe(2);
    expect(camera.getFollowTarget()).toBe(target);

    camera.setProjection("orthographic");
    camera.clearFollowTarget();

    expect(camera.getProjection()).toBe("orthographic");
    expect(camera.getFollowTarget()).toBeNull();
  });

  it("stores light type and basic emission settings", () => {
    const lightObject = new GameObject("Light");
    const light = new LightComponent({
      type: "point",
      color: "#ffcc88",
      intensity: 2,
      range: 20,
      castShadow: true,
    });

    lightObject.addComponent(light);

    expect(light.getType()).toBe("point");
    expect(light.getColor()).toBe("#ffcc88");
    expect(light.getIntensity()).toBe(2);
    expect(light.getRange()).toBe(20);
    expect(light.getCastShadow()).toBe(true);

    light.setType("spot");
    light.setIntensity(0.5);

    expect(light.getType()).toBe("spot");
    expect(light.getIntensity()).toBe(0.5);
  });
});
