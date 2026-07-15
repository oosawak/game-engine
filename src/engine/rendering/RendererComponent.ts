import { Component } from "../component/Component.js";
import type { RenderContext } from "./RenderContext.js";
import type { Renderer } from "./Renderer.js";

export class RendererComponent extends Component {
  private renderer: Renderer | null;
  private context: RenderContext | null;

  public constructor(renderer: Renderer | null = null, context: RenderContext | null = null) {
    super();
    this.renderer = renderer;
    this.context = context;
  }

  public setRenderer(renderer: Renderer | null): void {
    this.renderer = renderer;
  }

  public setContext(context: RenderContext | null): void {
    this.context = context;
  }

  public getRenderer(): Renderer | null {
    return this.renderer;
  }

  public getContext(): RenderContext | null {
    return this.context;
  }

  protected override render(context?: RenderContext): void {
    const renderContext = context ?? this.context;

    if (!this.renderer || !renderContext) {
      return;
    }

    this.renderer.render(renderContext);
  }
}
