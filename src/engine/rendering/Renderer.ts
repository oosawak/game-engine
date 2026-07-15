import type { RenderContext } from "./RenderContext.js";

export interface Renderer {
  render(context: RenderContext): void;
}
