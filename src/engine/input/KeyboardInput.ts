export class KeyboardInput {
  private readonly downKeys = new Set<string>();
  private readonly pressedKeys = new Set<string>();
  private readonly releasedKeys = new Set<string>();

  public handleKeyDown(key: string): void {
    if (!this.downKeys.has(key)) {
      this.pressedKeys.add(key);
    }

    this.downKeys.add(key);
  }

  public handleKeyUp(key: string): void {
    if (this.downKeys.delete(key)) {
      this.releasedKeys.add(key);
    }
  }

  public isDown(key: string): boolean {
    return this.downKeys.has(key);
  }

  public wasPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  public wasReleased(key: string): boolean {
    return this.releasedKeys.has(key);
  }

  public clearFrameState(): void {
    this.pressedKeys.clear();
    this.releasedKeys.clear();
  }

  public reset(): void {
    this.downKeys.clear();
    this.clearFrameState();
  }
}
