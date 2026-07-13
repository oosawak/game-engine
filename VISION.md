# Vision

## Vision Statement

Create a lightweight but extensible game engine that runs well in the web ecosystem and can grow into a shared platform for gameplay, tools, and realtime connectivity.

## Long-Term Direction

The engine should evolve into a foundation that supports:

- Browser-first game development
- Reusable gameplay and engine logic
- Modular rendering backends
- Shared runtime logic between client and server where practical
- Editor-assisted workflows
- Performance-critical computation in WASM or Rust

## Desired Qualities

- Simple to start with
- Clear to reason about
- Safe to extend
- Easy to test
- Friendly to future refactoring
- Explicit in ownership and lifecycle

## Architectural Identity

The engine is not intended to be a monolithic framework. It should be a collection of focused modules that can be composed:

- `core` for loop and orchestration
- `scene` for world state
- `object` for entity ownership
- `component` for behavior and features
- `rendering` for visual output
- `input` for device interaction
- `resource` for asset access
- `wasm` for performance-sensitive execution

## Future Platform Vision

The engine should remain compatible with a broader platform that may include:

- Shared protocol definitions
- WebRTC-based realtime communication
- Server-authoritative gameplay
- Asset and scene editors
- Plugin-based extensions

## What This Project Should Avoid

- Hardcoding gameplay into the engine core
- Tying object logic directly to renderer implementation details
- Allowing lifecycle rules to become inconsistent across modules
- Creating an architecture that only works for one demo project

