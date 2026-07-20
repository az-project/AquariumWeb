#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const DEFAULT_STATE_KEY = "default";

function loadDotEnv(file) {
  const envPath = path.join(ROOT, file);
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv(".env.local");
loadDotEnv(".env");

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function textResult(value) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
}

function normalizeState(value) {
  const baseTank = {
    id: "tank-default",
    name: value?.name || "나의 어항",
    aquariumType: value?.aquariumType || "saltwater",
    tankStart: value?.tankStart || todayIso(),
    aquariumBackground: value?.aquariumBackground || "saltwater-open",
    waterLogs: Array.isArray(value?.waterLogs) ? value.waterLogs : [],
    tasks: Array.isArray(value?.tasks) ? value.tasks : [],
    livestock: Array.isArray(value?.livestock) ? value.livestock : [],
    equipment: Array.isArray(value?.equipment) ? value.equipment : []
  };
  const tanks = Array.isArray(value?.tanks) && value.tanks.length ? value.tanks : [baseTank];
  const activeTankId = value?.activeTankId || tanks[0]?.id || baseTank.id;
  const activeTank = tanks.find(tank => tank.id === activeTankId) || tanks[0] || baseTank;
  return {
    name: activeTank.name,
    aquariumType: activeTank.aquariumType,
    tankStart: activeTank.tankStart,
    aquariumBackground: activeTank.aquariumBackground,
    waterLogs: activeTank.waterLogs || [],
    tasks: activeTank.tasks || [],
    livestock: activeTank.livestock || [],
    equipment: activeTank.equipment || [],
    activeTankId: activeTank.id,
    tanks
  };
}

function mirrorActiveTank(state) {
  const activeTank = getTank(state, state.activeTankId) || state.tanks[0];
  if (!activeTank) return state;
  return {
    ...state,
    name: activeTank.name,
    aquariumType: activeTank.aquariumType,
    tankStart: activeTank.tankStart,
    aquariumBackground: activeTank.aquariumBackground,
    waterLogs: activeTank.waterLogs || [],
    tasks: activeTank.tasks || [],
    livestock: activeTank.livestock || [],
    equipment: activeTank.equipment || []
  };
}

function getTank(state, tankId) {
  if (!tankId) return state.tanks.find(tank => tank.id === state.activeTankId) || state.tanks[0] || null;
  return state.tanks.find(tank => tank.id === tankId) || null;
}

function updateTank(state, tankId, updater) {
  const targetId = tankId || state.activeTankId || state.tanks[0]?.id;
  let found = false;
  const tanks = state.tanks.map(tank => {
    if (tank.id !== targetId) return tank;
    found = true;
    return updater(tank);
  });
  if (!found) throw new Error(`Tank not found: ${targetId}`);
  return mirrorActiveTank({ ...state, tanks });
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return {
    url: url.replace(/\/+$/, ""),
    key,
    stateKey: process.env.SUPABASE_STATE_KEY || DEFAULT_STATE_KEY
  };
}

function shouldUseSupabase() {
  return process.env.STORAGE_DRIVER === "supabase" || Boolean(supabaseConfig());
}

async function supabaseRequest(pathName, init = {}, query = "") {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase config is missing.");
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", `Bearer ${config.key}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${config.url}/rest/v1/${pathName}${query}`, {
    ...init,
    headers
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Supabase request failed: ${response.status}`);
  return text ? JSON.parse(text) : null;
}

async function readState() {
  if (shouldUseSupabase()) {
    const config = supabaseConfig();
    const rows = await supabaseRequest(
      "app_state",
      { method: "GET" },
      `?key=eq.${encodeURIComponent(config.stateKey)}&select=value&limit=1`
    );
    return normalizeState(rows?.[0]?.value || {});
  }
  if (!fs.existsSync(STATE_FILE)) return normalizeState({});
  return normalizeState(JSON.parse(fs.readFileSync(STATE_FILE, "utf8")));
}

async function writeState(state) {
  const nextState = mirrorActiveTank(normalizeState(state));
  if (shouldUseSupabase()) {
    const config = supabaseConfig();
    await supabaseRequest("app_state", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        key: config.stateKey,
        value: nextState,
        updated_at: new Date().toISOString()
      })
    }, "?on_conflict=key");
    return nextState;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(nextState, null, 2)}\n`);
  return nextState;
}

const tools = [
  {
    name: "reeflog_get_state",
    description: "리프로그 전체 저장 상태를 조회합니다.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "reeflog_list_tanks",
    description: "등록된 어항 목록과 요약 정보를 조회합니다.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "reeflog_get_tank",
    description: "특정 어항의 상세 데이터를 조회합니다. tankId를 생략하면 활성 어항을 조회합니다.",
    inputSchema: {
      type: "object",
      properties: {
        tankId: { type: "string" }
      }
    }
  },
  {
    name: "reeflog_list_water_logs",
    description: "수질 로그를 최신순으로 조회합니다.",
    inputSchema: {
      type: "object",
      properties: {
        tankId: { type: "string" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "reeflog_add_water_log",
    description: "수질 로그를 추가하거나 같은 날짜 로그를 갱신합니다.",
    inputSchema: {
      type: "object",
      required: ["date"],
      properties: {
        tankId: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
        temp: { type: "number" },
        salinity: { type: "number" },
        kh: { type: "number" },
        no3: { type: "number" },
        no2: { type: "number" },
        nh3: { type: "number" },
        po4: { type: "number" }
      }
    }
  },
  {
    name: "reeflog_list_livestock",
    description: "어항 생물 목록을 조회합니다.",
    inputSchema: {
      type: "object",
      properties: {
        tankId: { type: "string" }
      }
    }
  },
  {
    name: "reeflog_list_tasks",
    description: "관리 일정 목록을 예정일순으로 조회합니다.",
    inputSchema: {
      type: "object",
      properties: {
        tankId: { type: "string" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "reeflog_add_task",
    description: "관리 일정을 추가합니다.",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        tankId: { type: "string" },
        title: { type: "string" },
        category: { type: "string" },
        due: { type: "string", description: "YYYY-MM-DD" },
        memo: { type: "string" }
      }
    }
  }
];

async function callTool(name, args = {}) {
  const state = await readState();
  if (name === "reeflog_get_state") return textResult(state);
  if (name === "reeflog_list_tanks") {
    return textResult(state.tanks.map(tank => ({
      id: tank.id,
      name: tank.name,
      aquariumType: tank.aquariumType,
      active: tank.id === state.activeTankId,
      waterLogCount: tank.waterLogs?.length || 0,
      livestockCount: tank.livestock?.length || 0,
      taskCount: tank.tasks?.length || 0
    })));
  }
  if (name === "reeflog_get_tank") {
    const tank = getTank(state, args.tankId);
    if (!tank) throw new Error("Tank not found.");
    return textResult(tank);
  }
  if (name === "reeflog_list_water_logs") {
    const tank = getTank(state, args.tankId);
    if (!tank) throw new Error("Tank not found.");
    const limit = Number.isFinite(Number(args.limit)) ? Number(args.limit) : 30;
    const logs = [...(tank.waterLogs || [])].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, limit);
    return textResult(logs);
  }
  if (name === "reeflog_add_water_log") {
    if (!args.date) throw new Error("date is required.");
    const metricKeys = ["temp", "salinity", "kh", "no3", "no2", "nh3", "po4"];
    const log = { date: String(args.date) };
    for (const key of metricKeys) {
      if (args[key] !== undefined && args[key] !== null && args[key] !== "") log[key] = Number(args[key]);
    }
    const nextState = updateTank(state, args.tankId, tank => {
      const logs = (tank.waterLogs || []).filter(item => item.date !== log.date);
      return { ...tank, waterLogs: [...logs, log].sort((a, b) => String(a.date).localeCompare(String(b.date))) };
    });
    await writeState(nextState);
    return textResult({ ok: true, log });
  }
  if (name === "reeflog_list_livestock") {
    const tank = getTank(state, args.tankId);
    if (!tank) throw new Error("Tank not found.");
    return textResult(tank.livestock || []);
  }
  if (name === "reeflog_list_tasks") {
    const tank = getTank(state, args.tankId);
    if (!tank) throw new Error("Tank not found.");
    const limit = Number.isFinite(Number(args.limit)) ? Number(args.limit) : 30;
    const tasks = [...(tank.tasks || [])].sort((a, b) => String(a.due || "").localeCompare(String(b.due || ""))).slice(0, limit);
    return textResult(tasks);
  }
  if (name === "reeflog_add_task") {
    if (!args.title) throw new Error("title is required.");
    const task = {
      title: String(args.title),
      category: String(args.category || "관리"),
      due: String(args.due || todayIso()),
      memo: String(args.memo || "")
    };
    const nextState = updateTank(state, args.tankId, tank => ({ ...tank, tasks: [...(tank.tasks || []), task] }));
    await writeState(nextState);
    return textResult({ ok: true, task });
  }
  throw new Error(`Unknown tool: ${name}`);
}

function send(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
}

async function handle(message) {
  const { id, method, params } = message;
  try {
    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "reef-log-mcp", version: "1.0.0" }
        }
      });
      return;
    }
    if (method === "notifications/initialized") return;
    if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools } });
      return;
    }
    if (method === "tools/call") {
      const result = await callTool(params?.name, params?.arguments || {});
      send({ jsonrpc: "2.0", id, result });
      return;
    }
    send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
  } catch (error) {
    send({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

let buffer = Buffer.alloc(0);

function readMessages() {
  while (buffer.length > 0) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd >= 0) {
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        buffer = buffer.slice(headerEnd + 4);
        continue;
      }
      const length = Number(match[1]);
      const start = headerEnd + 4;
      if (buffer.length < start + length) return;
      const body = buffer.slice(start, start + length).toString("utf8");
      buffer = buffer.slice(start + length);
      void handle(JSON.parse(body));
      continue;
    }

    const newline = buffer.indexOf("\n");
    if (newline < 0) return;
    const line = buffer.slice(0, newline).toString("utf8").trim();
    buffer = buffer.slice(newline + 1);
    if (line) void handle(JSON.parse(line));
  }
}

process.stdin.on("data", chunk => {
  buffer = Buffer.concat([buffer, chunk]);
  readMessages();
});

process.stdin.on("end", () => process.exit(0));
