# Requirements

## Overview

This document defines the initial requirements for the Game Engine core MVP.

## Functional Requirements

### Engine Core

- The engine must initialize and shut down cleanly.
- The engine must run a deterministic update loop.
- The engine must calculate and expose delta time.
- The engine must support a configurable target FPS or update cadence.

### Scene Management

- The engine must support multiple scenes.
- The engine must allow scene registration.
- The engine must allow switching the active scene.
- The active scene must receive update and render calls.

### GameObject Management

- A scene must manage multiple GameObjects.
- A GameObject must have a unique identifier.
- A GameObject must support parent-child relationships.
- A GameObject must be removable and destroyable safely.

### Component System

- A GameObject must support attaching components.
- A GameObject must support retrieving components by type.
- A Component must have a lifecycle with `start`, `update`, and `destroy`.
- A Component must not run `start` more than once per activation cycle.
- `Transform` must exist as a required component on every GameObject.

### Transform and Math

- The engine must provide vector math primitives needed for positioning.
- Transform must support position, rotation, and scale.
- Transform must support basic translation and rotation operations.

### Testing

- The core lifecycle behavior must be covered by unit tests.
- Scene switching behavior must be testable.
- GameObject destruction behavior must be testable.

## Non-Functional Requirements

- The architecture must be modular.
- The core must be small enough to understand without deep framework knowledge.
- The codebase must be suitable for browser execution.
- The implementation must remain compatible with future WASM and Rust integration.
- The system must be designed for maintainability before premature optimization.

## Constraints

- The initial MVP should not depend on a full renderer implementation.
- The initial MVP should not require physics integration.
- The initial MVP should not require networking integration.
- The initial MVP should avoid overengineering around ECS until the component model is stable.

## Acceptance Criteria

- Engine start/stop works.
- Scene registration and switching work.
- GameObject creation, attachment, update, and destruction work.
- Component lifecycle order is correct.
- Transform is always present on a GameObject.
- Basic tests pass.

## Open Extension Points

- Rendering backend
- Input backend
- Resource loading
- Physics integration
- Networking protocol
- Editor integration
- ECS migration

