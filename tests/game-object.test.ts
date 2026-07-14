import { describe, expect, it } from "vitest";
import { Component } from "../src/engine/component/Component.js";
import { GameObject } from "../src/engine/object/GameObject.js";

class CounterComponent extends Component {
  public started = 0;
  public updated = 0;

  protected start(): void {
    this.started += 1;
  }

  protected update(): void {
    this.updated += 1;
  }
}

describe("GameObject", () => {
  it("attaches transform and components", () => {
    const object = new GameObject("Player");
    const component = object.addComponent(new CounterComponent());

    object.activate();
    object.update(0.016);

    expect(object.transform).toBeDefined();
    expect(object.getComponent(CounterComponent)).toBe(component);
    expect(component.started).toBe(1);
    expect(component.updated).toBe(1);
  });

  it("handles parent and child updates", () => {
    const parent = new GameObject("Parent");
    const child = new GameObject("Child");
    const component = child.addComponent(new CounterComponent());

    parent.addChild(child);
    parent.activate();
    parent.update(0.016);

    expect(component.updated).toBe(1);
    expect(child.parentObject).toBe(parent);
  });
});
