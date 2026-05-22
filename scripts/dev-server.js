const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const displayRoom = require("../api/display-room");
const gameBootstrap = require("../api/game-bootstrap");

const port = Number(process.env.PORT || 4173);
const publicDir = path.resolve(__dirname, "..", "public");

const mimeByExt = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".yaml": "application/x-yaml; charset=utf-8",
  ".yml": "application/x-yaml; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function sendNotFound(res) {
  res.statusCode = 404;
  res.end("Not found");
}

function toReqLike(req, query) {
  return {
    query,
    headers: req.headers
  };
}

function toResLike(res) {
  return {
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    status(code) {
      res.statusCode = code;
      return this;
    },
    send(body) {
      res.end(body);
      return this;
    }
  };
}

function serveStatic(urlPath, res) {
  const relativePath = urlPath === "/" ? "/play.html" : urlPath;
  const localPath = path.resolve(publicDir, `.${relativePath}`);
  if (!localPath.startsWith(publicDir)) {
    sendNotFound(res);
    return;
  }
  if (!fs.existsSync(localPath) || fs.statSync(localPath).isDirectory()) {
    sendNotFound(res);
    return;
  }
  const ext = path.extname(localPath).toLowerCase();
  res.setHeader("Content-Type", mimeByExt[ext] || "application/octet-stream");
  res.end(fs.readFileSync(localPath));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/display-room") {
    displayRoom(toReqLike(req, Object.fromEntries(url.searchParams.entries())), toResLike(res));
    return;
  }
  if (url.pathname === "/api/game-bootstrap") {
    gameBootstrap(toReqLike(req, Object.fromEntries(url.searchParams.entries())), toResLike(res));
    return;
  }
  serveStatic(url.pathname, res);
});

server.listen(port, () => {
  console.log(`Ruins playtest server running at http://localhost:${port}`);
});
