export interface PointerPosition {
  readonly x: number;
  readonly y: number;
}

export class PointerInput {
  private position: PointerPosition = { x: 0, y: 0 };
  private previousPosition: PointerPosition = { x: 0, y: 0 };
  private readonly buttons = new Set<number>();

  public handleMove(x: number, y: number): void {
    this.previousPosition = this.position;
    this.position = { x, y };
  }

  public handleDown(button: number): void {
    this.buttons.add(button);
  }

  public handleUp(button: number): void {
    this.buttons.delete(button);
  }

  public isDown(button: number): boolean {
    return this.buttons.has(button);
  }

  public getPosition(): PointerPosition {
    return { ...this.position };
  }

  public getDelta(): PointerPosition {
    return {
      x: this.position.x - this.previousPosition.x,
      y: this.position.y - this.previousPosition.y,
    };
  }

  public reset(): void {
    this.position = { x: 0, y: 0 };
    this.previousPosition = { x: 0, y: 0 };
    this.buttons.clear();
  }
}
