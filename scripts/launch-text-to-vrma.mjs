import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const appDir = join(process.cwd(), "third_party", "text-to-vrma");
const nodeModulesDir = join(appDir, "node_modules");
const port = process.env.TEXT_TO_VRMA_PORT || "4173";
const host = process.env.TEXT_TO_VRMA_HOST || "127.0.0.1";

if (!existsSync(join(appDir, "package.json"))) {
  console.error(`Text-To-VRMA package was not found at: ${appDir}`);
  process.exit(1);
}

if (!existsSync(nodeModulesDir)) {
  console.error([
    "Text-To-VRMA dependencies are not installed yet.",
    `Run: npm install --prefix ${appDir}`,
  ].join("\n"));
  process.exit(1);
}

const child = spawn(
  "npm",
  [
    "--prefix",
    appDir,
    "run",
    "dev",
    "--",
    "--host",
    host,
    "--port",
    port,
    "--strictPort",
  ],
  {
    stdio: "inherit",
    env: process.env,
  },
);

const shutdown = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(128 + 1);
  }
  process.exit(code ?? 0);
});
