import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT || 4173);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function extension(pathname) {
  const match = pathname.match(/\.[^.\\/]+$/);
  return match ? match[0].toLowerCase() : "";
}

function resolveRequest(urlPath) {
  let requestPath = decodeURIComponent(urlPath.split("?")[0]);
  if (requestPath === "/") requestPath = "/index.html";
  if (requestPath.startsWith("/content/")) {
    requestPath = `/public${requestPath}`;
  }
  const fullPath = normalize(join(root, requestPath));
  if (!fullPath.startsWith(root)) return null;
  if (existsSync(fullPath) && statSync(fullPath).isFile()) return fullPath;
  return join(root, "index.html");
}

const server = createServer((request, response) => {
  const filePath = resolveRequest(request.url || "/");
  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": mimeTypes.get(extension(filePath)) || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Camelot Legends demo server: http://localhost:${port}`);
});
