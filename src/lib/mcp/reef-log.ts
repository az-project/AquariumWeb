import { todayIso } from "@/lib/domain/constants";
import type { PersistedState, Tank, Task, WaterLog } from "@/lib/domain/types";
import { getStateStore } from "@/lib/storage";

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
    protocolVersion?: string;
  };
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: JsonRpcRequest["id"]; result: unknown }
  | { jsonrpc: "2.0"; id: JsonRpcRequest["id"]; error: { code: number; message: string } };

const DEFAULT_TANK_ID = "tank-default";

export const reefLogMcpTools: McpTool[] = [
  {
    name: "reeflog_get_state",
    description: "리프로그 전체 저장 상태를 조회합니다.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "reeflog_list_tanks",
    description: "등록된 어항 목록과 요약 정보를 조회합니다.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "reeflog_get_tank",
    description: "특정 어항의 상세 데이터를 조회합니다. tankId를 생략하면 활성 어항을 조회합니다.",
    inputSchema: {
      type: "object",
      properties: { tankId: { type: "string" } }
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
      properties: { tankId: { type: "string" } }
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

function normalizeState(value: unknown): PersistedState {
  const raw = value && typeof value === "object" ? value as Partial<PersistedState> : {};
  const fallbackTank: Tank = {
    id: DEFAULT_TANK_ID,
    name: raw.name || "나의 어항",
    aquariumType: raw.aquariumType || "saltwater",
    tankStart: raw.tankStart || todayIso(),
    aquariumBackground: raw.aquariumBackground || "saltwater-open",
    waterLogs: Array.isArray(raw.waterLogs) ? raw.waterLogs : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    livestock: Array.isArray(raw.livestock) ? raw.livestock : [],
    equipment: Array.isArray(raw.equipment) ? raw.equipment : []
  };
  const tanks = Array.isArray(raw.tanks) && raw.tanks.length ? raw.tanks : [fallbackTank];
  const activeTankId = raw.activeTankId || tanks[0]?.id || DEFAULT_TANK_ID;
  const activeTank = tanks.find(tank => tank.id === activeTankId) || tanks[0] || fallbackTank;
  return mirrorActiveTank({
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
  });
}

function mirrorActiveTank(state: PersistedState): PersistedState {
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

function getTank(state: PersistedState, tankId?: unknown): Tank | null {
  const id = typeof tankId === "string" && tankId ? tankId : state.activeTankId;
  return state.tanks.find(tank => tank.id === id) || state.tanks[0] || null;
}

function updateTank(state: PersistedState, tankId: unknown, updater: (tank: Tank) => Tank): PersistedState {
  const targetId = typeof tankId === "string" && tankId ? tankId : state.activeTankId;
  let found = false;
  const tanks = state.tanks.map(tank => {
    if (tank.id !== targetId) return tank;
    found = true;
    return updater(tank);
  });
  if (!found) throw new Error(`Tank not found: ${targetId}`);
  return mirrorActiveTank({ ...state, tanks });
}

function toToolResult(value: unknown) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
}

function numberArg(args: Record<string, unknown>, key: keyof WaterLog): number | undefined {
  const value = args[key];
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

async function readState(): Promise<PersistedState> {
  return normalizeState(await getStateStore().read());
}

async function writeState(state: PersistedState): Promise<PersistedState> {
  const nextState = mirrorActiveTank(normalizeState(state));
  await getStateStore().write(nextState);
  return nextState;
}

export async function callReefLogTool(name: string | undefined, args: Record<string, unknown> = {}) {
  const state = await readState();
  if (name === "reeflog_get_state") return toToolResult(state);
  if (name === "reeflog_list_tanks") {
    return toToolResult(state.tanks.map(tank => ({
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
    return toToolResult(tank);
  }
  if (name === "reeflog_list_water_logs") {
    const tank = getTank(state, args.tankId);
    if (!tank) throw new Error("Tank not found.");
    const limit = Number.isFinite(Number(args.limit)) ? Number(args.limit) : 30;
    return toToolResult([...(tank.waterLogs || [])]
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, limit));
  }
  if (name === "reeflog_add_water_log") {
    if (!args.date) throw new Error("date is required.");
    const log: WaterLog = { date: String(args.date) };
    for (const key of ["temp", "salinity", "kh", "no3", "no2", "nh3", "po4"] as const) {
      const value = numberArg(args, key);
      if (value !== undefined) log[key] = value;
    }
    const nextState = updateTank(state, args.tankId, tank => {
      const logs = (tank.waterLogs || []).filter(item => item.date !== log.date);
      return { ...tank, waterLogs: [...logs, log].sort((a, b) => a.date.localeCompare(b.date)) };
    });
    await writeState(nextState);
    return toToolResult({ ok: true, log });
  }
  if (name === "reeflog_list_livestock") {
    const tank = getTank(state, args.tankId);
    if (!tank) throw new Error("Tank not found.");
    return toToolResult(tank.livestock || []);
  }
  if (name === "reeflog_list_tasks") {
    const tank = getTank(state, args.tankId);
    if (!tank) throw new Error("Tank not found.");
    const limit = Number.isFinite(Number(args.limit)) ? Number(args.limit) : 30;
    return toToolResult([...(tank.tasks || [])]
      .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")))
      .slice(0, limit));
  }
  if (name === "reeflog_add_task") {
    if (!args.title) throw new Error("title is required.");
    const task: Task = {
      title: String(args.title),
      category: String(args.category || "관리"),
      due: String(args.due || todayIso()),
      memo: String(args.memo || "")
    };
    const nextState = updateTank(state, args.tankId, tank => ({ ...tank, tasks: [...(tank.tasks || []), task] }));
    await writeState(nextState);
    return toToolResult({ ok: true, task });
  }
  throw new Error(`Unknown tool: ${name || ""}`);
}

export async function handleReefLogMcpRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const id = request.id ?? null;
  try {
    if (request.method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: request.params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "reef-log-mcp", version: "1.0.0" }
        }
      };
    }
    if (request.method === "notifications/initialized") return null;
    if (request.method === "tools/list") {
      return { jsonrpc: "2.0", id, result: { tools: reefLogMcpTools } };
    }
    if (request.method === "tools/call") {
      const result = await callReefLogTool(request.params?.name, request.params?.arguments || {});
      return { jsonrpc: "2.0", id, result };
    }
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${request.method || ""}` }
    };
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
