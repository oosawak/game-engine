import { describe, expect, it } from "vitest";
import { Material } from "../src/engine/rendering/Material.js";
import { Mesh } from "../src/engine/rendering/Mesh.js";
import { Shader } from "../src/engine/rendering/Shader.js";

describe("Rendering primitives", () => {
  it("stores mesh data", () => {
    const mesh = new Mesh("mesh-1", "Cube", [
      {
        name: "position",
        data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        itemSize: 3,
      },
    ]);

    expect(mesh.id).toBe("mesh-1");
    expect(mesh.attributes).toHaveLength(1);
  });

  it("stores material and shader metadata", () => {
    const shader = new Shader("shader-1", "Basic", {
      vertex: "void main() {}",
      fragment: "void main() {}",
    });
    const material = new Material("material-1", "Default", shader.id, {
      color: "#ffffff",
      roughness: 0.5,
    });

    expect(shader.source.vertex).toContain("main");
    expect(material.shaderId).toBe(shader.id);
    expect(material.uniforms.color).toBe("#ffffff");
  });
});
