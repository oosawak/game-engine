import { describe, expect, it } from "vitest";
import { ScriptComponent, type ScriptLifecycle } from "../src/engine/script/ScriptComponent.js";
import { GameObject } from "../src/engine/object/GameObject.js";

describe("ScriptComponent", () => {
  it("forwards lifecycle calls to the script object", () => {
    const calls: string[] = [];
    const script: ScriptLifecycle = {
      start: () => calls.push("start"),
      update: (_context, deltaTime) => calls.push(`update:${deltaTime}`),
      render: () => calls.push("render"),
      destroy: () => calls.push("destroy"),
    };

    const object = new GameObject("Player");
    const component = object.addComponent(new ScriptComponent(script));

    object.activate();
    object.update(0.016);
    object.render();
    component.internalDestroy();

    expect(calls).toEqual(["start", "update:0.016", "render", "destroy"]);
  });
});
