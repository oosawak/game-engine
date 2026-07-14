export type FrameCallback = (timestamp: number) => void;
export type FrameRequest = (callback: FrameCallback) => number;
export type FrameCancel = (frameId: number) => void;

export interface GameLoopOptions {
  requestFrame?: FrameRequest;
  cancelFrame?: FrameCancel;
  now?: () => number;
}

export class GameLoop {
  private readonly requestFrame: FrameRequest;
  private readonly cancelFrame: FrameCancel;
  private readonly now: () => number;
  private frameId: number | null = null;
  private running = false;

  public constructor(options: GameLoopOptions = {}) {
    this.requestFrame = options.requestFrame ?? ((callback) => {
      const handle = setTimeout(() => callback(this.now()), 16);
      return Number(handle);
    });
    this.cancelFrame = options.cancelFrame ?? ((frameId) => clearTimeout(frameId));
    this.now = options.now ?? (() => performance.now());
  }

  public start(callback: FrameCallback): void {
    if (this.running) {
      return;
    }

    this.running = true;

    const tick = (timestamp: number): void => {
      if (!this.running) {
        return;
      }

      callback(timestamp);
      this.frameId = this.requestFrame(tick);
    };

    this.frameId = this.requestFrame(tick);
  }

  public stop(): void {
    this.running = false;

    if (this.frameId !== null) {
      this.cancelFrame(this.frameId);
      this.frameId = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }
}
