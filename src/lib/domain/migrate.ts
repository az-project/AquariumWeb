// app.js:179-306 이식 — 상태 마이그레이션/정규화.
// 이 모듈은 데이터 유실 방지의 핵심 방어선이다. 동작 변경 시 반드시
// __tests__/migrate.test.ts 의 운영 데이터 픽스처를 함께 검증할 것.
import { aquariumBackgrounds, aquariumTypes, todayIso } from "./constants";
import type { AquariumTypeId, PersistedState, Tank, TankSnapshot } from "./types";

export function cloneData<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function tankSnapshot(tank: Tank): TankSnapshot {
  return {
    name: tank.name,
    aquariumType: tank.aquariumType,
    tankStart: tank.tankStart,
    aquariumBackground: tank.aquariumBackground,
    waterLogs: cloneData(tank.waterLogs || []),
    tasks: cloneData(tank.tasks || []),
    livestock: cloneData(tank.livestock || []),
    equipment: cloneData(tank.equipment || [])
  };
}

export function createTank(type: AquariumTypeId = "saltwater", name = "", id = ""): Tank {
  const aquariumType: AquariumTypeId = aquariumTypes[type] ? type : "saltwater";
  const config = aquariumTypes[aquariumType];
  return {
    id: id || `tank-${aquariumType}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: name || config.defaultName,
    aquariumType,
    tankStart: todayIso(),
    aquariumBackground: config.defaultBackground,
    waterLogs: [],
    tasks: [],
    livestock: [],
    equipment: []
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeTank(tank: any, fallbackType: AquariumTypeId = "saltwater", fallbackName = ""): Tank {
  const type: AquariumTypeId = aquariumTypes[tank?.aquariumType as AquariumTypeId] ? tank.aquariumType : fallbackType;
  const config = aquariumTypes[type] || aquariumTypes.saltwater;
  const id = tank?.id || `tank-${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const background = aquariumBackgrounds.some(item => item.id === tank?.aquariumBackground)
    ? tank.aquariumBackground
    : config.defaultBackground;
  return {
    id,
    name: String(tank?.name || fallbackName || config.defaultName),
    aquariumType: type,
    tankStart: tank?.tankStart || todayIso(),
    aquariumBackground: background,
    waterLogs: Array.isArray(tank?.waterLogs) ? tank.waterLogs : [],
    tasks: Array.isArray(tank?.tasks) ? tank.tasks : [],
    livestock: Array.isArray(tank?.livestock) ? tank.livestock.map(normalizeLivestockAsset) : [],
    equipment: Array.isArray(tank?.equipment) ? tank.equipment : []
  };
}

export function normalizeLivestockAsset<T extends { image?: string }>(item: T): T {
  if (item?.image === "assets/livestock/cleaner-shrimp.png") {
    return { ...item, image: "assets/livestock/cleaner-shrimp-v2.png" };
  }
  return item;
}

export function seedState(): PersistedState {
  const seedTank = createTank("saltwater", aquariumTypes.saltwater.defaultName, "tank-saltwater-main");
  return {
    activeTankId: seedTank.id,
    tanks: [seedTank],
    ...tankSnapshot(seedTank)
  };
}

/**
 * 어떤 버전의 저장 상태든 현재 멀티탱크 구조로 변환한다.
 * - null/깨진 입력 → seed
 * - 데모 샘플 데이터 → seed
 * - tanks[] 있음 → 각 탱크 normalize + activeTankId 검증
 * - 구버전 평면 구조 → 단일 해수탱크(tank-saltwater-main)로 래핑 (waterLogs 등 데이터 보존!)
 */
export function migrateState(data: any): PersistedState {
  if (!data) return seedState();
  if (isDefaultSampleState(data)) return seedState();

  if (Array.isArray(data.tanks) && data.tanks.length) {
    const tanks = data.tanks.map((tank: any) => normalizeTank(tank));
    const activeTankId = tanks.some((tank: Tank) => tank.id === data.activeTankId) ? data.activeTankId : tanks[0].id;
    const nextState = { ...data, tanks, activeTankId };
    Object.assign(nextState, tankSnapshot(tanks.find((tank: Tank) => tank.id === activeTankId) || tanks[0]));
    return nextState as PersistedState;
  }

  const legacyTank = normalizeTank({
    id: "tank-saltwater-main",
    name: "나의 해수어항",
    aquariumType: "saltwater",
    tankStart: data.tankStart,
    aquariumBackground: data.aquariumBackground,
    waterLogs: data.waterLogs,
    tasks: data.tasks,
    livestock: data.livestock,
    equipment: data.equipment
  });
  return {
    activeTankId: legacyTank.id,
    tanks: [legacyTank],
    ...tankSnapshot(legacyTank)
  };
}

export function isDefaultSampleState(data: any): boolean {
  if (!data || data.tankStart !== "2026-05-20") return false;
  const hasSampleWater = data.waterLogs?.some((log: any) => log.date === "2026-06-01" && Number(log.temp) === 25.4);
  const hasSampleLivestock = data.livestock?.some((item: any) => item.name === "니모 1호" || item.name === "블루탱");
  const hasSampleEquipment = data.equipment?.some((item: any) => item.name === "조명" || item.name === "스키머");
  return Boolean(hasSampleWater || hasSampleLivestock || hasSampleEquipment);
}

/**
 * 저장(PUT/localStorage) 직전 직렬화 — tanks[]가 원본이지만 바닐라 앱·구버전
 * 롤백 호환을 위해 최상위에 activeTank 미러 필드를 재생성한다.
 */
export function serializeState(activeTankId: string, tanks: Tank[]): PersistedState {
  const active = tanks.find(tank => tank.id === activeTankId) || tanks[0];
  return {
    activeTankId: active ? (tanks.some(t => t.id === activeTankId) ? activeTankId : active.id) : activeTankId,
    tanks: cloneData(tanks),
    ...tankSnapshot(active || createTank())
  };
}
