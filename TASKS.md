# Game Engine Tasks

## Goal

Turn the design documents into an implementable TypeScript game engine core.

## Task Rules

- Follow dependency order.
- Keep the MVP small and testable.
- Do not add rendering or networking complexity before the core lifecycle is stable.
- Mark a task complete only after its tests pass.

## Phase 0: Project Setup

- [ ] Confirm the package manager and runtime setup
- [ ] Create the initial `src/` directory structure
- [ ] Add `tsconfig.json`
- [ ] Add test runner configuration
- [ ] Add lint and format configuration if the project does not already have them

## Phase 1: Math Foundation

- [ ] Implement `Vector3`
- [ ] Implement `Vector2`
- [ ] Implement `Quaternion`
- [ ] Implement `Matrix4`
- [ ] Add unit tests for vector construction and basic operations

## Phase 2: Component Core

- [ ] Implement `Component`
- [ ] Implement lifecycle guards for `start`, `update`, `render`, and `destroy`
- [ ] Ensure `Component` ownership can only be assigned internally
- [ ] Add unit tests for lifecycle state transitions

## Phase 3: Transform

- [ ] Implement `Transform` as a required component
- [ ] Add position, rotation, and scale state
- [ ] Add translation and rotation helpers
- [ ] Add unit tests for transform mutation

## Phase 4: GameObject

- [ ] Implement `GameObject`
- [ ] Ensure every `GameObject` receives a `Transform`
- [ ] Implement component attachment
- [ ] Implement component lookup by type
- [ ] Implement component removal with `Transform` protection
- [ ] Implement child management
- [ ] Implement activation and deactivation
- [ ] Implement destruction safety
- [ ] Add unit tests for component attachment and lifecycle propagation
- [ ] Add unit tests for parent-child behavior

## Phase 5: Scene System

- [ ] Implement `Scene`
- [ ] Implement `SceneManager`
- [ ] Register multiple scenes
- [ ] Support scene switching
- [ ] Ensure scene activation and exit behavior works
- [ ] Ensure scenes update and render active objects only
- [ ] Add unit tests for scene registration and switching

## Phase 6: Timing and Engine Core

- [ ] Implement `Time`
- [ ] Implement `GameLoop`
- [ ] Implement `Engine`
- [ ] Wire `Engine` to `SceneManager` and `Time`
- [ ] Support `start` and `stop`
- [ ] Support delta time calculation
- [ ] Add unit tests for loop control and time behavior

## Phase 7: Script Support

- [x] Implement `ScriptComponent`
- [x] Define the script lifecycle contract
- [ ] Add sample gameplay behavior component
- [x] Add unit tests for user-defined component execution

## Phase 8: Rendering Boundary

- [x] Define `Renderer` interface
- [x] Define `RenderContext`
- [x] Implement `RendererComponent`
- [ ] Implement `CameraComponent`
- [ ] Implement `LightComponent`
- [ ] Add placeholder `Mesh`, `Material`, and `Shader` types
- [ ] Keep render collection separate from gameplay logic

## Phase 9: Input and Resources

- [ ] Implement `InputManager`
- [ ] Implement `KeyboardInput`
- [ ] Implement `PointerInput`
- [ ] Implement `Resource`
- [ ] Implement `ResourceLoader`
- [ ] Implement `ResourceManager`

## Phase 10: WASM Bridge

- [ ] Implement `WasmRuntime`
- [ ] Implement `WasmMemory`
- [ ] Define binding entry points
- [ ] Keep the engine functional without WASM enabled

## Phase 11: Application Layer

- [ ] Implement `Game`
- [ ] Implement `MainScene`
- [ ] Add a minimal application bootstrap
- [ ] Add an example scene with a moving object

## Phase 12: Quality and Verification

- [ ] Add core lifecycle tests
- [ ] Add scene switching tests
- [ ] Add destruction safety tests
- [ ] Add parent-child update tests
- [ ] Add build verification
- [ ] Add README usage notes for the first runnable state

## MVP Definition

The first MVP is done when:

- `Engine` starts and stops
- delta time is available
- multiple scenes can be registered and switched
- `GameObject` can own components and children
- `Transform` exists on every object
- lifecycle order is correct
- destroyed objects stop updating
- tests pass for the core systems

## Suggested Implementation Order

1. `Vector3`
2. `Component`
3. `Transform`
4. `GameObject`
5. `Scene`
6. `SceneManager`
7. `Time`
8. `Engine`
9. `ScriptComponent`
10. Rendering boundary
