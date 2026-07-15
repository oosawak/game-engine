import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const sourceDir = join(root, "docs");
const targetDir = join(root, "dist", "web");
const publicDir = join(targetDir, "public");
const assetsDir = join(targetDir, "assets");

const assetFiles = [
  "vrm-editor-data.json",
  "shared-assets.json",
  "test002.mp4",
];

async function main() {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(publicDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });
  await cp(sourceDir, publicDir, { recursive: true });

  await rewriteFile(
    join(publicDir, "vrm-editor.js"),
    "./vrm-editor-data.json",
    "../assets/vrm-editor-data.json",
  );
  await rewriteFile(
    join(publicDir, "vrm-motion.js"),
    "./vrm-editor-data.json",
    "../assets/vrm-editor-data.json",
  );
  await rewriteFile(
    join(publicDir, "explanation.html"),
    "./test002.mp4",
    "../assets/test002.mp4",
  );

  for (const fileName of assetFiles) {
    await cp(join(sourceDir, fileName), join(assetsDir, fileName));
  }

  await writeFile(
    join(targetDir, "index.html"),
    `<!DOCTYPE html>
<meta http-equiv="refresh" content="0; url=./public/index.html">
<title>Redirecting</title>
<p>Redirecting to public/index.html...</p>
`,
  );

  console.log(`Exported web output from ${sourceDir} to ${targetDir}`);
}

async function rewriteFile(filePath, searchValue, replaceValue) {
  const source = await readFile(filePath, "utf8");
  const updated = source.replaceAll(searchValue, replaceValue);
  if (updated !== source) {
    await writeFile(filePath, updated, "utf8");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
