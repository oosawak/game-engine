import { describe, expect, it } from "vitest";
import { InputManager } from "../src/engine/input/InputManager.js";
import { ResourceManager } from "../src/engine/resource/ResourceManager.js";

describe("Input and resource systems", () => {
  it("attaches and detaches input listeners", () => {
    const listeners = new Map<string, EventListener[]>();
    const target = {
      addEventListener: (type: string, listener: EventListener) => {
        const list = listeners.get(type) ?? [];
        list.push(listener);
        listeners.set(type, list);
      },
      removeEventListener: (type: string, listener: EventListener) => {
        const list = listeners.get(type) ?? [];
        listeners.set(
          type,
          list.filter((entry) => entry !== listener),
        );
      },
    };

    const input = new InputManager({
      target,
      pointerTarget: target,
    });

    input.attach();
    expect(listeners.get("keydown")).toHaveLength(1);
    expect(listeners.get("pointermove")).toHaveLength(1);

    input.detach();
    expect(listeners.get("keydown")).toHaveLength(0);
    expect(listeners.get("pointermove")).toHaveLength(0);
  });

  it("tracks keyboard and pointer state", () => {
    const input = new InputManager();
    const keyboard = input.getKeyboard();
    const pointer = input.getPointer();

    keyboard.handleKeyDown("w");
    pointer.handleMove(10, 20);
    pointer.handleDown(0);

    expect(keyboard.isDown("w")).toBe(true);
    expect(keyboard.wasPressed("w")).toBe(true);
    expect(pointer.getPosition()).toEqual({ x: 10, y: 20 });
    expect(pointer.isDown(0)).toBe(true);

    input.update();

    expect(keyboard.wasPressed("w")).toBe(false);
    keyboard.handleKeyUp("w");
    expect(keyboard.isDown("w")).toBe(false);
    expect(keyboard.wasReleased("w")).toBe(true);
  });

  it("loads and caches resources by type and id", async () => {
    const manager = new ResourceManager();
    const calls: string[] = [];

    manager.registerLoader("json", {
      load: async (source: string) => {
        calls.push(source);
        return { source, loaded: true };
      },
    });

    const first = await manager.load("json", "manifest", "/assets/manifest.json");
    const second = await manager.load("json", "manifest", "/assets/manifest.json");

    expect(first).toEqual({ source: "/assets/manifest.json", loaded: true });
    expect(second).toBe(first);
    expect(calls).toEqual(["/assets/manifest.json"]);
    expect(manager.get("json", "manifest")).toBe(first);
  });
});
