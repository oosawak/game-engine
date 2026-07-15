import { Component } from "./Component.js";

export type LightType = "directional" | "point" | "spot";

export class LightComponent extends Component {
  private type: LightType;
  private color: string;
  private intensity: number;
  private range: number;
  private castShadow: boolean;

  public constructor(options: {
    type?: LightType;
    color?: string;
    intensity?: number;
    range?: number;
    castShadow?: boolean;
  } = {}) {
    super();
    this.type = options.type ?? "directional";
    this.color = options.color ?? "#ffffff";
    this.intensity = options.intensity ?? 1;
    this.range = options.range ?? 10;
    this.castShadow = options.castShadow ?? false;
  }

  public getType(): LightType {
    return this.type;
  }

  public setType(type: LightType): void {
    this.type = type;
  }

  public getColor(): string {
    return this.color;
  }

  public setColor(color: string): void {
    this.color = color;
  }

  public getIntensity(): number {
    return this.intensity;
  }

  public setIntensity(intensity: number): void {
    this.intensity = intensity;
  }

  public getRange(): number {
    return this.range;
  }

  public setRange(range: number): void {
    this.range = range;
  }

  public getCastShadow(): boolean {
    return this.castShadow;
  }

  public setCastShadow(castShadow: boolean): void {
    this.castShadow = castShadow;
  }
}
