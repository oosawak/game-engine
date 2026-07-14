export class Time {
  private lastTimestamp: number | null = null;
  private deltaTime = 0;
  private elapsedTime = 0;
  private frameCount = 0;

  public constructor(
    public readonly targetFps = 60,
  ) {}

  public reset(timestamp = 0): void {
    this.lastTimestamp = timestamp;
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.frameCount = 0;
  }

  public update(timestamp: number): number {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      this.deltaTime = 0;
      return this.deltaTime;
    }

    const rawDelta = Math.max(0, timestamp - this.lastTimestamp);
    this.lastTimestamp = timestamp;
    this.deltaTime = Math.min(rawDelta / 1000, 0.25);
    this.elapsedTime += this.deltaTime;
    this.frameCount += 1;
    return this.deltaTime;
  }

  public getDeltaTime(): number {
    return this.deltaTime;
  }

  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  public getFrameCount(): number {
    return this.frameCount;
  }
}
