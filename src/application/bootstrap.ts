import { Game } from "./Game.js";

export function bootstrapGame(): Game {
  const game = new Game();
  game.initialize();
  return game;
}
