# Game Engine Design

## 1. Design Goals

The engine is designed as a browser-first, component-based foundation for games and interactive simulations.

Primary goals:

- Keep the core small and understandable
- Separate orchestration, state, and behavior
- Make lifecycle rules explicit
- Leave room for future rendering, physics, and networking systems
- Preserve a path toward Rust/WASM and shared protocol integration

## 2. System Overview

### 2.1 Layered Architecture

```text
Application Layer
  -> Game API Layer
  -> Engine Core Layer
  -> Rendering / Physics / Resource Layer
  -> WASM Runtime Layer
  -> Browser / Hardware
```

### 2.2 Core Modules

- `core`: engine orchestration and game loop
- `scene`: scene registration and switching
- `object`: game object ownership and hierarchy
- `component`: lifecycle-managed behaviors
- `math`: basic vectors, quaternions, and matrices
- `rendering`: render pipeline integration
- `input`: keyboard and pointer input
- `resource`: asset loading and caching
- `wasm`: WASM runtime bridge

## 3. Class Model

### 3.1 Relationship Summary

```text
Engine
  -> SceneManager
  -> Time

SceneManager
  -> Scene

Scene
  -> GameObject

GameObject
  -> Component
  -> Transform
  -> Child GameObject[]
```

### 3.2 Responsibility Map

#### Engine

- Start, stop, and drive the update loop
- Own the scene manager and timing system
- Coordinate update and render execution

#### SceneManager

- Register scenes
- Switch the active scene
- Forward update and render calls

#### Scene

- Own a collection of game objects
- Activate and deactivate contained objects
- Update and render active objects

#### GameObject

- Represent a single entity in the game world
- Hold components and child objects
- Always own a `Transform`

#### Component

- Provide behavior in a lifecycle-driven way
- Expose `start`, `update`, `render`, and `destroy`
- Support activation and destruction safety

## 4. Proposed Folder Structure

```text
src/
  engine/
    core/
      Engine.ts
      GameLoop.ts
      Time.ts
      EngineContext.ts
    scene/
      Scene.ts
      SceneManager.ts
    object/
      GameObject.ts
      ObjectId.ts
    component/
      Component.ts
      Transform.ts
      ScriptComponent.ts
      CameraComponent.ts
      LightComponent.ts
      RendererComponent.ts
    math/
      Vector2.ts
      Vector3.ts
      Quaternion.ts
      Matrix4.ts
    rendering/
      Renderer.ts
      RenderContext.ts
      Mesh.ts
      Material.ts
      Shader.ts
    input/
      InputManager.ts
      KeyboardInput.ts
      PointerInput.ts
    resource/
      ResourceManager.ts
      Resource.ts
      ResourceLoader.ts
    events/
      EventEmitter.ts
      EngineEvent.ts
    wasm/
      WasmRuntime.ts
      WasmMemory.ts
  application/
    Game.ts
    MainScene.ts
  index.ts
tests/
```

## 5. Core Interfaces

### 5.1 Engine

```ts
export interface EngineOptions {
  targetFps?: number;
  canvas?: HTMLCanvasElement;
}

export class Engine {
  public initialize(): void;
  public start(): void;
  public stop(): void;
  public getSceneManager(): SceneManager;
}
```

### 5.2 SceneManager

```ts
export class SceneManager {
  public addScene(scene: Scene): void;
  public changeScene(name: string): void;
  public update(deltaTime: number): void;
  public render(): void;
  public getCurrentScene(): Scene | null;
}
```

### 5.3 Scene

```ts
export class Scene {
  public constructor(public readonly name: string);
  public enter(): void;
  public exit(): void;
  public addObject(gameObject: GameObject): void;
  public removeObject(id: string): boolean;
  public update(deltaTime: number): void;
  public render(): void;
}
```

### 5.4 GameObject

```ts
export class GameObject {
  public readonly id: string;
  public readonly transform: Transform;

  public constructor(name: string);
  public addComponent<T extends Component>(component: T): T;
  public getComponent<T extends Component>(type: new (...args: never[]) => T): T | null;
  public removeComponent(component: Component): boolean;
  public addChild(child: GameObject): void;
  public removeChild(child: GameObject): boolean;
  public activate(): void;
  public deactivate(): void;
  public update(deltaTime: number): void;
  public render(): void;
  public destroy(): void;
}
```

### 5.5 Component

```ts
export abstract class Component {
  public owner: GameObject | null = null;
  public enabled = true;

  public internalStart(): void;
  public internalUpdate(deltaTime: number): void;
  public internalRender(): void;
  public internalDestroy(): void;

  protected start(): void;
  protected update(_deltaTime: number): void;
  protected render(): void;
  protected destroy(): void;
}
```

## 6. Lifecycle Rules

### 6.1 Activation Flow

1. Component is created
2. Component is attached to a GameObject
3. GameObject is added to a Scene
4. Scene is activated
5. Component `start` runs once
6. Component `update` runs every frame while active
7. Component `destroy` runs once when removed or destroyed

### 6.2 Safety Rules

- `Transform` cannot be removed from a GameObject
- `start` must not run more than once per activation
- Destroyed objects must not receive further updates
- Child objects follow the parent active state

## 7. Rendering Direction

The initial core does not need a complete renderer. The design keeps the rendering boundary separate so that a later implementation can choose one of the following:

- direct Canvas 2D rendering
- WebGL
- WebGPU
- renderer backed by a WASM-friendly command buffer

Recommended direction:

- Keep visual components lightweight
- Let `Renderer` gather renderable state
- Avoid coupling gameplay logic to GPU details

## 8. WASM and Rust Integration

WASM is treated as a performance layer, not the main ownership model.

Potential use cases:

- math-heavy simulation
- physics stepping
- pathfinding
- animation evaluation
- shared protocol encoding and decoding

The JavaScript/TypeScript engine should remain operational even when WASM is absent.

## 9. Networking Extension Point

Networking is not part of the core MVP, but the architecture should leave a clear seam for it.

Planned future integration:

- shared protocol types
- client/server command synchronization
- WebRTC transport
- server-authoritative updates

This means scene and gameplay logic should avoid depending directly on transport details.

## 10. Implementation Order

Recommended build order:

1. `Vector3`
2. `Component`
3. `Transform`
4. `GameObject`
5. `Scene`
6. `SceneManager`
7. `Time`
8. `Engine`
9. `ScriptComponent`
10. Rendering-related modules

## 11. MVP Completion Criteria

The core MVP is complete when:

- the engine loop starts and stops
- delta time is available
- multiple scenes can be registered
- the active scene can be switched
- a scene can manage multiple game objects
- components can be attached and queried by type
- every game object has a transform
- parent-child relationships work
- component lifecycle order is correct
- destroyed objects stop updating
- basic tests pass

## 12. Next Step

If this document is accepted, the next step is to create the initial TypeScript source files that match this design and then add tests for lifecycle and scene management.

## 13. Mint MCP Integration Layer

### 13.1 Positioning

Mint MCP should be integrated as an external asset supply layer, not as part of the engine core.

- The core engine must run without Mint
- Mint is a productivity layer for asset generation and updates
- `mint-threejs-skills` should be treated as the client-side integration guide for using Mint MCP with Three.js

### 13.2 Responsibility Split

- Mint MCP: 3D asset generation and metadata delivery
- Integration Layer: fetch, normalize, cache, and provide fallbacks
- Editor Layer: inspect, name, save, and replace generated assets
- Runtime Layer: load and render normalized assets

### 13.3 Suggested Folder Structure

```text
src/
  integration/
    mint/
      MintMcpAdapter.ts
      MintAssetProvider.ts
      MintAssetManifest.ts
      MintAssetCache.ts
      MintAssetNormalizer.ts
      MintColliderAdapter.ts
      MintStreamingAdapter.ts
  assets/
    manifest/
      mint-assets.json
      vrm-motion-manifest.json
```

### 13.4 Asset Flow

```text
AI Agent
  -> Mint MCP
  -> Asset URL / Metadata / Collider / Streaming info
  -> Mint Integration Layer
  -> Engine Resource / Scene / Editor
```

### 13.5 Supported Data Types

- Gaussian Splat
- GLTF / GLB
- Collider metadata
- Streaming references
- Display name, tags, priority, and script reference name

### 13.6 Design Principles

- Store generated assets as JSON manifests
- Fall back to local data when remote assets fail to load
- Keep the engine core independent from Mint
- Allow the Editor and Runtime to read the same manifest
- Separate `id` and `scriptName` for generated results

### 13.7 Relationship to Three.js

`mint-threejs-skills` should be understood as the Three.js-side client guidance for:

- Loading assets
- Validating generated outputs
- Placing colliders
- Managing metadata for display
- Connecting editor screens to runtime assets
