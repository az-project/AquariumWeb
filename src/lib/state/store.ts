// 전역 상태 — 바닐라의 state 미러(hydrate/syncActiveTank) 구조를 폐기하고
// tanks[]를 단일 진실로 둔다. 직렬화 시에만 serializeState()가 미러를 재생성.
import { create } from "zustand";
import { aquariumTypes, todayIso } from "@/lib/domain/constants";
import { cloneData, createTank, migrateState, serializeState } from "@/lib/domain/migrate";
import type {
  AquariumTypeId,
  Equipment,
  Livestock,
  PersistedState,
  Tank,
  TankPosition,
  Task,
  WaterLog
} from "@/lib/domain/types";
import { readLocalState, writeLocalState } from "./local-backup";
import { cancelScheduledSave, fetchSharedState, scheduleSharedStateSave } from "./sync";

export type ViewId = "dashboard" | "water" | "livestock" | "library";
export type AuthStatus = "checking" | "locked" | "ready";

interface AppStore {
  authStatus: AuthStatus;
  authMode: "local" | "server";
  currentUser: string | null;
  sharedStateEnabled: boolean;

  view: ViewId;
  activeTankId: string;
  tanks: Tank[];
  selectedLivestockIndex: number | null;

  // --- lifecycle ---
  initialize: () => Promise<void>;
  onAuthenticated: (username: string) => Promise<void>;
  logout: () => Promise<void>;

  // --- shell ---
  setView: (view: ViewId) => void;
  switchTank: (tankId: string) => void;
  addTank: (type: AquariumTypeId) => void;
  deleteActiveTank: () => void;
  selectLivestock: (index: number | null) => void;

  // --- active tank data (모든 변경은 persistSoon 경유) ---
  updateActiveTank: (updater: (tank: Tank) => Tank) => void;
  upsertWaterLog: (index: number | null, log: WaterLog) => void;
  deleteWaterLog: (index: number) => void;
  upsertLivestock: (index: number | null, item: Livestock) => void;
  deleteLivestock: (index: number) => void;
  setLivestockPosition: (index: number, position: TankPosition) => void;
  upsertEquipment: (index: number | null, item: Equipment) => void;
  deleteEquipment: (index: number) => void;
  addTask: (task: Task) => void;
  setTankSettings: (settings: { name?: string; tankStart?: string; aquariumBackground?: string }) => void;
}

function seedTanks(): { activeTankId: string; tanks: Tank[] } {
  const tank = createTank("saltwater", aquariumTypes.saltwater.defaultName, "tank-saltwater-main");
  return { activeTankId: tank.id, tanks: [tank] };
}

export const useAppStore = create<AppStore>((set, get) => {
  /** 데이터 변경 후 호출 — localStorage 백업 + (서버 모드면) 디바운스 PUT */
  function persistSoon() {
    const snapshot = currentSnapshot();
    writeLocalState(snapshot);
    if (get().authMode !== "server" || !get().sharedStateEnabled) return;
    scheduleSharedStateSave(currentSnapshot, result => {
      if (result === "unauthorized") {
        set({ authStatus: "locked", sharedStateEnabled: false });
      } else if (result === "error") {
        set({ sharedStateEnabled: false });
      }
    });
  }

  function currentSnapshot(): PersistedState {
    const { activeTankId, tanks } = get();
    return serializeState(activeTankId, tanks);
  }

  /** 서버/로컬에서 받은 원본을 마이그레이션해 스토어에 적재 (persist 스케줄 안 함) */
  function hydrate(raw: unknown) {
    const migrated = migrateState(raw);
    set({
      activeTankId: migrated.activeTankId,
      tanks: migrated.tanks,
      selectedLivestockIndex: null
    });
    writeLocalState(migrated);
  }

  function mutateActiveTank(updater: (tank: Tank) => Tank) {
    const { activeTankId, tanks } = get();
    set({
      tanks: tanks.map(tank => (tank.id === activeTankId ? updater(cloneData(tank)) : tank))
    });
    persistSoon();
  }

  function resetEditingState() {
    set({ selectedLivestockIndex: null });
  }

  return {
    authStatus: "checking",
    authMode: "local",
    currentUser: null,
    sharedStateEnabled: false,
    view: "dashboard",
    ...seedTanks(),
    selectedLivestockIndex: null,

    // --- lifecycle (app.js:413-495, 308-333 이식) ---
    async initialize() {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        if (!response.ok) {
          // 세션 API 없음(정적 서빙 등) → 로컬 모드
          hydrate(readLocalState());
          set({ authMode: "local", authStatus: "ready" });
          return;
        }
        const session = await response.json();
        if (!session.authenticated) {
          set({ authMode: "server", authStatus: "locked", currentUser: null });
          return;
        }
        set({ authMode: "server", currentUser: session.username });
        await get().onAuthenticated(session.username);
      } catch {
        hydrate(readLocalState());
        set({ authMode: "local", authStatus: "ready" });
      }
    },

    async onAuthenticated(username: string) {
      set({ authMode: "server", currentUser: username });
      try {
        const { status, data } = await fetchSharedState();
        if (status === 401) {
          set({ authStatus: "locked", sharedStateEnabled: false });
          return;
        }
        set({ sharedStateEnabled: true, authStatus: "ready" });
        if (data && typeof data === "object" && Object.keys(data).length) {
          hydrate(data);
        } else {
          // 서버가 비어있으면 로컬 백업(있다면)을 올린다
          hydrate(readLocalState());
          persistSoon();
        }
      } catch {
        set({ sharedStateEnabled: false, authStatus: "ready" });
        hydrate(readLocalState());
      }
    },

    async logout() {
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch {
        // 네트워크가 끊겨도 UI는 로그인 화면으로 돌아간다
      }
      cancelScheduledSave();
      set({ currentUser: null, sharedStateEnabled: false, authStatus: "locked" });
    },

    // --- shell ---
    setView(view) {
      set({ view });
    },

    // app.js:529-539
    switchTank(tankId) {
      if (!get().tanks.some(tank => tank.id === tankId)) return;
      set({ activeTankId: tankId });
      resetEditingState();
      persistSoon();
    },

    // app.js:541-553
    addTank(type) {
      const { tanks } = get();
      const sameTypeCount = tanks.filter(tank => tank.aquariumType === type).length + 1;
      const tank = createTank(type, `${aquariumTypes[type].label} ${sameTypeCount}`);
      set({ tanks: [...tanks, tank], activeTankId: tank.id });
      resetEditingState();
      persistSoon();
    },

    // app.js:555-569 (confirm은 컴포넌트에서 수행)
    deleteActiveTank() {
      const { tanks, activeTankId } = get();
      if (tanks.length <= 1) return;
      const remaining = tanks.filter(tank => tank.id !== activeTankId);
      set({ tanks: remaining, activeTankId: remaining[0].id });
      resetEditingState();
      persistSoon();
    },

    selectLivestock(index) {
      set({ selectedLivestockIndex: index });
    },

    // --- active tank data ---
    updateActiveTank: mutateActiveTank,

    upsertWaterLog(index, log) {
      mutateActiveTank(tank => {
        const waterLogs = [...tank.waterLogs];
        if (index !== null && Number.isInteger(index) && waterLogs[index]) waterLogs[index] = log;
        else waterLogs.push(log);
        return { ...tank, waterLogs };
      });
    },

    deleteWaterLog(index) {
      mutateActiveTank(tank => ({ ...tank, waterLogs: tank.waterLogs.filter((_, i) => i !== index) }));
    },

    upsertLivestock(index, item) {
      mutateActiveTank(tank => {
        const livestock = [...tank.livestock];
        if (index !== null && Number.isInteger(index) && livestock[index]) {
          livestock[index] = { ...item, tankPosition: livestock[index].tankPosition };
        } else {
          livestock.push(item);
        }
        return { ...tank, livestock };
      });
      const { tanks, activeTankId } = get();
      const active = tanks.find(tank => tank.id === activeTankId);
      set({ selectedLivestockIndex: index ?? (active ? active.livestock.length - 1 : null) });
    },

    deleteLivestock(index) {
      const { selectedLivestockIndex } = get();
      mutateActiveTank(tank => ({ ...tank, livestock: tank.livestock.filter((_, i) => i !== index) }));
      if (selectedLivestockIndex === index) set({ selectedLivestockIndex: null });
      else if (selectedLivestockIndex !== null && selectedLivestockIndex > index) {
        set({ selectedLivestockIndex: selectedLivestockIndex - 1 });
      }
    },

    setLivestockPosition(index, position) {
      mutateActiveTank(tank => ({
        ...tank,
        livestock: tank.livestock.map((item, i) => (i === index ? { ...item, tankPosition: position } : item))
      }));
    },

    upsertEquipment(index, item) {
      mutateActiveTank(tank => {
        const equipment = [...tank.equipment];
        if (index !== null && Number.isInteger(index) && equipment[index]) equipment[index] = item;
        else equipment.push(item);
        return { ...tank, equipment };
      });
    },

    deleteEquipment(index) {
      mutateActiveTank(tank => ({ ...tank, equipment: tank.equipment.filter((_, i) => i !== index) }));
    },

    addTask(task) {
      mutateActiveTank(tank => ({ ...tank, tasks: [...tank.tasks, task] }));
    },

    setTankSettings(settings) {
      mutateActiveTank(tank => ({
        ...tank,
        name: settings.name ?? tank.name,
        tankStart: settings.tankStart ?? tank.tankStart ?? todayIso(),
        aquariumBackground: settings.aquariumBackground ?? tank.aquariumBackground
      }));
    }
  };
});

/** 현재 활성 탱크 — 바닐라의 activeTank()(app.js:254) 대응 셀렉터 */
export function useActiveTank(): Tank {
  return useAppStore(state => state.tanks.find(tank => tank.id === state.activeTankId) ?? state.tanks[0]);
}
