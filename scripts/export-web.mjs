import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const sourceDir = join(root, "docs");
const targetDir = join(root, "dist", "web");

async function main() {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });
  console.log(`Exported web output from ${sourceDir} to ${targetDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
