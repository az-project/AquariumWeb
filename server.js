const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const port = Number(process.env.PORT || 4174);
const dataDir = process.env.DATA_DIR || path.join(rootDir, "data");
const statePath = path.join(dataDir, "state.json");
const maxBodyBytes = 2 * 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": payload.length,
    "Cache-Control": type.startsWith("application/json") ? "no-store" : "public, max-age=0"
  });
  res.end(payload);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value), "application/json; charset=utf-8");
}

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(Object.assign(new Error("Invalid JSON"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

async function handleApi(req, res, url) {
  if (url.pathname !== "/api/state") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  ensureDataDir();
  if (req.method === "GET") {
    if (!fs.existsSync(statePath)) {
      sendJson(res, 200, null);
      return;
    }
    send(res, 200, fs.readFileSync(statePath), "application/json; charset=utf-8");
    return;
  }

  if (req.method === "PUT") {
    try {
      const state = await readJsonBody(req);
      const tmpPath = `${statePath}.tmp`;
      fs.writeFileSync(tmpPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
      fs.renameSync(tmpPath, statePath);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, error.status || 500, { error: error.message || "Save failed" });
    }
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

function serveStatic(req, res, url) {
  const rawPath = decodeURIComponent(url.pathname);
  const relativePath = rawPath === "/" ? "index.html" : rawPath.replace(/^\/+/, "");
  const filePath = path.resolve(rootDir, relativePath);

  if (!filePath.startsWith(rootDir)) {
    send(res, 403, "Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  send(res, 200, fs.readFileSync(filePath), mimeTypes[ext] || "application/octet-stream");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
    return;
  }
  serveStatic(req, res, url);
});

server.listen(port, "0.0.0.0", () => {
  ensureDataDir();
  console.log(`AquariumWeb running at http://0.0.0.0:${port}`);
  console.log(`Shared state file: ${statePath}`);
});
