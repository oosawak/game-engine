# game-engine
GameEngine Three.js + WASM + WebRTC + Rust Gamelogic + Javascript/Typescript + wGPU

## Web output

The browser-facing source of truth lives in `docs/`.
When you need a publishable bundle, export `docs/` to `dist/web` with:

```bash
npm run export:web
```

The export creates:

- `dist/web/public` for HTML and JavaScript docs
- `dist/web/assets` for runtime data and media files
- `dist/web/index.html` as a redirect to the public entry point

For local development and verification, serve `docs/` directly.
That keeps the edit source and the preview source aligned while `dist/web` remains a generated output.

## Editor

The main editor surface is `docs/editor.html`. It is the browser-based editor for cube creation, hierarchy selection, inspector editing, 2D / 3D switching, and play-mode validation.

The VRM-specific editor surface is `docs/vrm-editor.html`.

The runtime preview surface is `docs/game-view.html`.

## Mint integration

`mint-threejs-skills` is the Three.js-side client surface for Mint MCP. The current repository keeps Mint-specific runtime integration separate from the engine core, and documents the connection point in `docs/mint-assets.html`.

The Mint adapter can register its manifest loaders on the shared `ResourceManager`, then build a runtime load plan and hand each asset to a per-kind loader.

```ts
import {
  MintMcpAdapter,
  ResourceManager,
  createMintRuntimeLoaderMap,
} from "./dist/index.js";

const resourceManager = new ResourceManager();

const adapter = new MintMcpAdapter({
  provider,
  resourceManager,
});

adapter.registerLoaders(resourceManager);
await adapter.loadManifest();

const runtime = createMintRuntimeLoaderMap([
  {
    kind: "model",
    load: async (entry) => {
      return { id: entry.asset.id, source: entry.source };
    },
  },
]);

const summary = await adapter.loadRuntime(runtime);
```
