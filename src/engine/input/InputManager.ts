import { KeyboardInput } from "./KeyboardInput.js";
import { PointerInput } from "./PointerInput.js";

export interface InputManagerOptions {
  target?: Pick<Window, "addEventListener" | "removeEventListener"> | null;
  pointerTarget?: Pick<HTMLElement, "addEventListener" | "removeEventListener"> | null;
}

export class InputManager {
  private readonly keyboard = new KeyboardInput();
  private readonly pointer = new PointerInput();
  private readonly target: InputManagerOptions["target"];
  private readonly pointerTarget: InputManagerOptions["pointerTarget"];
  private isAttached = false;

  public constructor(options: InputManagerOptions = {}) {
    this.target = options.target ?? null;
    this.pointerTarget = options.pointerTarget ?? null;
  }

  public attach(): void {
    if (this.isAttached) {
      return;
    }

    this.target?.addEventListener("keydown", this.handleKeyDown);
    this.target?.addEventListener("keyup", this.handleKeyUp);
    this.target?.addEventListener("blur", this.handleBlur);
    this.pointerTarget?.addEventListener("pointermove", this.handlePointerMove);
    this.pointerTarget?.addEventListener("pointerdown", this.handlePointerDown);
    this.pointerTarget?.addEventListener("pointerup", this.handlePointerUp);
    this.isAttached = true;
  }

  public detach(): void {
    if (!this.isAttached) {
      return;
    }

    this.target?.removeEventListener("keydown", this.handleKeyDown);
    this.target?.removeEventListener("keyup", this.handleKeyUp);
    this.target?.removeEventListener("blur", this.handleBlur);
    this.pointerTarget?.removeEventListener("pointermove", this.handlePointerMove);
    this.pointerTarget?.removeEventListener("pointerdown", this.handlePointerDown);
    this.pointerTarget?.removeEventListener("pointerup", this.handlePointerUp);
    this.isAttached = false;
  }

  public update(): void {
    this.keyboard.clearFrameState();
  }

  public reset(): void {
    this.keyboard.reset();
    this.pointer.reset();
  }

  public getKeyboard(): KeyboardInput {
    return this.keyboard;
  }

  public getPointer(): PointerInput {
    return this.pointer;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.keyboard.handleKeyDown(event.key);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keyboard.handleKeyUp(event.key);
  };

  private readonly handleBlur = (): void => {
    this.keyboard.reset();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.pointer.handleMove(event.clientX, event.clientY);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointer.handleDown(event.button);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.pointer.handleUp(event.button);
  };
}
