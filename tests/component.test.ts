import { describe, expect, it } from "vitest";
import { Component } from "../src/engine/component/Component.js";

class TestComponent extends Component {
  public startedCount = 0;
  public updatedCount = 0;
  public renderedCount = 0;
  public destroyedCount = 0;

  protected start(): void {
    this.startedCount += 1;
  }

  protected update(): void {
    this.updatedCount += 1;
  }

  protected render(): void {
    this.renderedCount += 1;
  }

  protected destroy(): void {
    this.destroyedCount += 1;
  }
}

describe("Component lifecycle", () => {
  it("protects lifecycle execution", () => {
    const component = new TestComponent();

    component.internalStart();
    component.internalStart();
    component.internalUpdate(0.016);
    component.internalRender();
    component.internalDestroy();
    component.internalUpdate(0.016);

    expect(component.startedCount).toBe(1);
    expect(component.updatedCount).toBe(1);
    expect(component.renderedCount).toBe(1);
    expect(component.destroyedCount).toBe(1);
  });
});
