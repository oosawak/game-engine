import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const engineDir = join(process.cwd(), "third_party", "text-to-vrma", "tools", "ardy-engine");
const venvPython = join(engineDir, ".venv", "bin", "python");
const serverScript = join(engineDir, "server.py");
const mergedBase = process.env.ARDY_MERGED_BASE || join(engineDir, "llm2vec-base-merged");
const port = process.env.ARDY_PORT || "2337";
const noTranslate = process.env.ARDY_NO_TRANSLATE === "1" || process.env.ARDY_NO_TRANSLATE === "true";

if (!existsSync(venvPython)) {
  console.error(`Missing venv: ${venvPython}`);
  console.error("Run: npm run setup:ardy-engine");
  process.exit(1);
}

if (!existsSync(serverScript)) {
  console.error(`Missing server script: ${serverScript}`);
  process.exit(1);
}

if (!existsSync(mergedBase)) {
  console.error(`Missing merged base model: ${mergedBase}`);
  console.error("Set ARDY_MERGED_BASE or create the local merged-base model first.");
  process.exit(1);
}

const args = [serverScript, "--port", port, "--merged-base", mergedBase];
if (noTranslate) {
  args.push("--no-translate");
}

const child = spawn(venvPython, args, {
  cwd: engineDir,
  stdio: "inherit",
  env: {
    ...process.env,
    TEXT_ENCODER_DEVICE: process.env.TEXT_ENCODER_DEVICE || "cpu",
  },
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("exit", (code) => process.exit(code ?? 0));
