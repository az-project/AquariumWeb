import fs from "node:fs";
import path from "node:path";

const DEFAULT_STATE_KEY = "default";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function dataDir() {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function validateStateShape(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("state.json must contain a JSON object.");
  }
  const hasTanks = Array.isArray(state.tanks) && state.tanks.length > 0;
  const hasLegacyKeys = ["waterLogs", "tasks", "livestock", "equipment"].some(key => Array.isArray(state[key]));
  if (!hasTanks && !hasLegacyKeys) {
    throw new Error("state.json does not look like an AquariumWeb state file.");
  }
}

function supabaseConfig() {
  return {
    url: requiredEnv("SUPABASE_URL").replace(/\/+$/, ""),
    key: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    stateKey: process.env.SUPABASE_STATE_KEY || DEFAULT_STATE_KEY
  };
}

async function supabaseRequest(config, pathName, init = {}, query = "") {
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", `Bearer ${config.key}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${config.url}/rest/v1/${pathName}${query}`, {
    ...init,
    headers
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${pathName} failed with ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function migrateState(config) {
  const statePath = path.join(dataDir(), "state.json");
  const state = readJsonIfExists(statePath);
  if (!state) {
    console.log("No data/state.json found. Skipping state migration.");
    return;
  }

  validateStateShape(state);
  await supabaseRequest(config, "app_state", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      key: config.stateKey,
      value: state,
      updated_at: new Date().toISOString()
    })
  }, "?on_conflict=key");
  console.log(`Migrated state.json to app_state key "${config.stateKey}".`);
}

async function migrateUsers(config) {
  const usersPath = path.join(dataDir(), "users.json");
  const data = readJsonIfExists(usersPath);
  const users = Array.isArray(data?.users) ? data.users : [];
  if (!users.length) {
    console.log("No data/users.json users found. Skipping user migration; the app can seed a default account on first login.");
    return;
  }

  const rows = users.map(user => ({
    username: user.username,
    username_key: user.usernameKey || String(user.username || "").toLowerCase(),
    password: user.password,
    created_at: user.createdAt || new Date().toISOString()
  }));

  await supabaseRequest(config, "app_users", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows)
  }, "?on_conflict=username_key");
  console.log(`Migrated ${rows.length} user(s) to app_users.`);
}

async function main() {
  const config = supabaseConfig();
  await migrateState(config);
  await migrateUsers(config);
  console.log("File-to-Supabase migration complete.");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
