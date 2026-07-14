import { GameLoop, type GameLoopOptions } from "./GameLoop.js";
import { Time } from "./Time.js";
import { SceneManager } from "../scene/SceneManager.js";

export interface EngineOptions {
  targetFps?: number;
  sceneManager?: SceneManager;
  time?: Time;
  loop?: GameLoopOptions;
}

export class Engine {
  private readonly sceneManager: SceneManager;
  private readonly time: Time;
  private readonly loop: GameLoop;
  private running = false;

  public constructor(options: EngineOptions = {}) {
    this.sceneManager = options.sceneManager ?? new SceneManager();
    this.time = options.time ?? new Time(options.targetFps ?? 60);
    this.loop = new GameLoop(options.loop);
  }

  public initialize(timestamp = 0): void {
    this.time.reset(timestamp);
  }

  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.time.reset(performance.now());
    this.loop.start((timestamp) => {
      if (!this.running) {
        return;
      }

      this.tick(timestamp);
    });
  }

  public stop(): void {
    this.running = false;
    this.loop.stop();
  }

  public tick(timestamp: number): number {
    const deltaTime = this.time.update(timestamp);
    this.sceneManager.update(deltaTime);
    this.sceneManager.render();
    return deltaTime;
  }

  public update(timestamp: number): number {
    return this.tick(timestamp);
  }

  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  public getTime(): Time {
    return this.time;
  }

  public isRunning(): boolean {
    return this.running;
  }
}
