import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const engineDir = join(process.cwd(), "third_party", "text-to-vrma", "tools", "ardy-engine");
const ardyDir = join(engineDir, "ardy");
const venvDir = join(engineDir, ".venv");
const venvPython = join(venvDir, "bin", "python");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

if (!existsSync(ardyDir)) {
  console.log("Cloning ARDY source...");
  await run("git", ["clone", "--depth", "1", "https://github.com/nv-tlabs/ardy.git", ardyDir]);
}

if (!existsSync(venvPython)) {
  console.log("Creating Python venv...");
  await run("python3", ["-m", "venv", "--system-site-packages", venvDir]);
}

console.log("Installing ARDY into the venv...");
await run(venvPython, ["-m", "pip", "install", "-e", ardyDir], { cwd: ardyDir });

console.log("");
console.log("ARDY bootstrap complete.");
console.log(`Venv: ${venvPython}`);
console.log("Next step: place or configure the model weights (merged-base / ARDY checkpoints).");
