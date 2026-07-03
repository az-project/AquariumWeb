const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const port = Number(process.env.PORT || 4174);
const dataDir = process.env.DATA_DIR || path.join(rootDir, "data");
const statePath = path.join(dataDir, "state.json");
const usersPath = path.join(dataDir, "users.json");
const maxBodyBytes = 2 * 1024 * 1024;
const appUsername = process.env.APP_USERNAME || "admin";
const appPassword = process.env.APP_PASSWORD || "aquarium";
const sessionCookieName = "aquarium_session";
const sessionMaxAgeSeconds = 7 * 24 * 60 * 60;
const secureCookie = /^true$/i.test(process.env.COOKIE_SECURE || "");
const sessions = new Map();
const loginAttempts = new Map();

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

function send(res, status, body, type = "text/plain; charset=utf-8", extraHeaders = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": payload.length,
    "Cache-Control": type.startsWith("application/json") ? "no-store" : "public, max-age=0",
    ...extraHeaders
  });
  res.end(payload);
}

function sendJson(res, status, value, extraHeaders = {}) {
  send(res, status, JSON.stringify(value), "application/json; charset=utf-8", extraHeaders);
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

function parseCookies(req) {
  return (req.headers.cookie || "").split(";").reduce((cookies, item) => {
    const [rawName, ...rawValue] = item.trim().split("=");
    if (!rawName) return cookies;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function getSession(req) {
  const token = parseCookies(req)[sessionCookieName];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function createSession(username) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    username,
    expiresAt: Date.now() + sessionMaxAgeSeconds * 1000
  });
  return token;
}

function sessionCookie(token) {
  const secure = secureCookie ? "; Secure" : "";
  return `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionMaxAgeSeconds}${secure}`;
}

function expiredSessionCookie() {
  const secure = secureCookie ? "; Secure" : "";
  return `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

function timingsafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function normalizeUsername(username = "") {
  return String(username).trim();
}

function validateUsername(username) {
  if (!/^[A-Za-z0-9_.-]{3,32}$/.test(username)) {
    return "아이디는 영문, 숫자, 점, 밑줄, 하이픈으로 3~32자까지 입력하세요.";
  }
  return "";
}

function validatePassword(password = "") {
  if (String(password).length < 6) return "비밀번호는 6자 이상 입력하세요.";
  return "";
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { algorithm: "pbkdf2-sha256", iterations: 120000, salt, hash };
}

function verifyPassword(password, user) {
  if (!user?.password?.salt || !user.password.hash) return false;
  const iterations = Number(user.password.iterations || 120000);
  const hash = crypto.pbkdf2Sync(String(password), user.password.salt, iterations, 32, "sha256").toString("hex");
  return timingsafeEqual(hash, user.password.hash);
}

function readUsers() {
  ensureDataDir();
  if (!fs.existsSync(usersPath)) {
    const seedUser = {
      username: appUsername,
      usernameKey: appUsername.toLowerCase(),
      password: hashPassword(appPassword),
      createdAt: new Date().toISOString()
    };
    writeUsers([seedUser]);
    return [seedUser];
  }

  try {
    const data = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    return Array.isArray(data.users) ? data.users : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  ensureDataDir();
  const tmpPath = `${usersPath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify({ users }, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, usersPath);
}

function findUser(username, users = readUsers()) {
  const usernameKey = normalizeUsername(username).toLowerCase();
  return users.find(user => user.usernameKey === usernameKey) || null;
}

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (ip || req.socket.remoteAddress || "unknown").trim();
}

function isLoginLimited(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) return false;
  return attempt.count >= 8;
}

function recordLoginFailure(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return;
  }
  attempt.count += 1;
}

function clearLoginFailures(req) {
  loginAttempts.delete(getClientKey(req));
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (isLoginLimited(req)) {
    sendJson(res, 429, { error: "Too many login attempts. Try again later." });
    return;
  }

  try {
    const credentials = await readJsonBody(req);
    const username = normalizeUsername(credentials.username);
    const user = findUser(username);
    if (!user || !verifyPassword(credentials.password || "", user)) {
      recordLoginFailure(req);
      sendJson(res, 401, { error: "Invalid username or password." });
      return;
    }

    clearLoginFailures(req);
    const token = createSession(user.username);
    sendJson(res, 200, { ok: true, username: user.username }, { "Set-Cookie": sessionCookie(token) });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Login failed" });
  }
}

async function handleRegister(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    if (usernameError || passwordError) {
      sendJson(res, 400, { error: usernameError || passwordError });
      return;
    }

    const users = readUsers();
    if (findUser(username, users)) {
      sendJson(res, 409, { error: "이미 사용 중인 아이디입니다." });
      return;
    }

    const user = {
      username,
      usernameKey: username.toLowerCase(),
      password: hashPassword(password),
      createdAt: new Date().toISOString()
    };
    writeUsers([...users, user]);

    const token = createSession(user.username);
    sendJson(res, 201, { ok: true, username: user.username }, { "Set-Cookie": sessionCookie(token) });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Registration failed" });
  }
}

function handleLogout(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const session = getSession(req);
  if (session) sessions.delete(session.token);
  sendJson(res, 200, { ok: true }, { "Set-Cookie": expiredSessionCookie() });
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/session") {
    const session = getSession(req);
    sendJson(res, 200, session ? { authenticated: true, username: session.username } : { authenticated: false });
    return;
  }

  if (url.pathname === "/api/login") {
    await handleLogin(req, res);
    return;
  }

  if (url.pathname === "/api/register") {
    await handleRegister(req, res);
    return;
  }

  if (url.pathname === "/api/logout") {
    handleLogout(req, res);
    return;
  }

  if (url.pathname !== "/api/state") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  if (!getSession(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
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

const publicFiles = new Set([
  "index.html",
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "service-worker.js"
]);

function isPublicAsset(relativePath) {
  return publicFiles.has(relativePath) || relativePath.startsWith("assets/");
}

function serveStatic(req, res, url) {
  const rawPath = decodeURIComponent(url.pathname);
  const relativePath = rawPath === "/" ? "index.html" : rawPath.replace(/^\/+/, "");
  const filePath = path.resolve(rootDir, relativePath);
  const rootPrefix = `${path.resolve(rootDir)}${path.sep}`;

  if (filePath !== path.join(rootDir, "index.html") && !filePath.startsWith(rootPrefix)) {
    send(res, 403, "Forbidden");
    return;
  }

  // 앱 구동에 필요한 자산만 공개. server.js, Dockerfile 등 소스 노출 차단.
  if (!isPublicAsset(relativePath)) {
    send(res, 404, "Not found");
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
  console.log(`Login username: ${appUsername}`);
});
