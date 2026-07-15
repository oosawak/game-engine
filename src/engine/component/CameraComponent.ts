import { Component } from "./Component.js";
import type { GameObject } from "../object/GameObject.js";

export type CameraProjection = "perspective" | "orthographic";

export class CameraComponent extends Component {
  private projection: CameraProjection;
  private fieldOfView: number;
  private near: number;
  private far: number;
  private zoom: number;
  private followTarget: GameObject | null;

  public constructor(options: {
    projection?: CameraProjection;
    fieldOfView?: number;
    near?: number;
    far?: number;
    zoom?: number;
    followTarget?: GameObject | null;
  } = {}) {
    super();
    this.projection = options.projection ?? "perspective";
    this.fieldOfView = options.fieldOfView ?? 60;
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 1000;
    this.zoom = options.zoom ?? 1;
    this.followTarget = options.followTarget ?? null;
  }

  public getProjection(): CameraProjection {
    return this.projection;
  }

  public setProjection(projection: CameraProjection): void {
    this.projection = projection;
  }

  public getFieldOfView(): number {
    return this.fieldOfView;
  }

  public setFieldOfView(fieldOfView: number): void {
    this.fieldOfView = fieldOfView;
  }

  public getNear(): number {
    return this.near;
  }

  public setNear(near: number): void {
    this.near = near;
  }

  public getFar(): number {
    return this.far;
  }

  public setFar(far: number): void {
    this.far = far;
  }

  public getZoom(): number {
    return this.zoom;
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  public getFollowTarget(): GameObject | null {
    return this.followTarget;
  }

  public setFollowTarget(target: GameObject | null): void {
    this.followTarget = target;
  }

  public clearFollowTarget(): void {
    this.followTarget = null;
  }
}
