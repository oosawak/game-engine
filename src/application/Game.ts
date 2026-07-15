import { Engine, type EngineOptions } from "../engine/core/Engine.js";
import { MainScene } from "./MainScene.js";

export interface GameOptions extends EngineOptions {}

export class Game {
  private readonly engine: Engine;

  public constructor(options: GameOptions = {}) {
    this.engine = new Engine(options);
    this.engine.getSceneManager().addScene(MainScene.create());
    this.engine.getSceneManager().changeScene("MainScene");
  }

  public initialize(timestamp = 0): void {
    this.engine.initialize(timestamp);
  }

  public start(): void {
    this.engine.start();
  }

  public stop(): void {
    this.engine.stop();
  }

  public getEngine(): Engine {
    return this.engine;
  }
}
