# game-engine
GameEngine Three.js + WASM + WebRTC + Rust Gamelogic + Javascript/Typescript + wGPU

## Web output

The current browser output can be exported to `dist/web` with:

```bash
npm run export:web
```

The export creates:

- `dist/web/public` for HTML and JavaScript docs
- `dist/web/assets` for runtime data and media files
- `dist/web/index.html` as a redirect to the public entry point
