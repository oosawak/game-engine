import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { readFile, stat } from "node:fs/promises";

const rootDir = join(process.cwd(), "third_party", "text-to-vrma");
const port = Number.parseInt(process.env.TEXT_TO_VRMA_PORT || "4173", 10);
const host = process.env.TEXT_TO_VRMA_HOST || "127.0.0.1";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".vrm", "model/gltf-binary"],
  [".bin", "application/octet-stream"],
]);

function send(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  res.end(body);
}

async function resolvePath(requestPath) {
  const cleaned = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.(\/|\\|$))+/, "");
  const relativePath = cleaned === "/" ? "/index.html" : cleaned;
  const filePath = join(rootDir, `.${relativePath}`);
  const info = await stat(filePath);
  if (info.isDirectory()) {
    return join(filePath, "index.html");
  }
  return filePath;
}

createServer(async (req, res) => {
  try {
    const method = req.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      send(res, 405, "Method Not Allowed");
      return;
    }

    const url = new URL(req.url || "/", `http://${host}:${port}`);
    const filePath = await resolvePath(url.pathname);
    const body = await readFile(filePath);
    const contentType = contentTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream";
    res.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store",
    });
    if (method === "HEAD") {
      res.end();
      return;
    }
    res.end(body);
  } catch (error) {
    send(res, 404, "Not Found");
  }
}).listen(port, host, () => {
  process.stdout.write(`Text-To-VRMA server running at http://${host}:${port}/\n`);
});
