// app.js 파생/포맷 헬퍼 이식 (360-361, 496, 594-720, 842-881, 1252-1286).
// 바닐라의 전역 state 의존을 제거하고 tank/type을 인자로 받는다.
import {
  aquariumBackgrounds,
  aquariumTypes,
  livestockAssetMap,
  livestockMotionMap,
  species,
  todayIso,
  waterMetricSets,
  type LivestockMotionPair
} from "./constants";
import type { AquariumTypeId, Livestock, Species, Tank, Task, WaterLog, WaterMetric } from "./types";

export const daysBetween = (a: string, b: string): number =>
  Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000);

export function isValidDateString(value: unknown): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export function hasNumber(value: unknown): boolean {
  return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
}

export function optionalNumber(value: unknown): number | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

export function formatNumber(value: unknown, digits: number): string {
  if (!hasNumber(value)) return "-";
  const number = Number(value);
  return number.toFixed(digits);
}

export function formatMetric(value: unknown, digits: number, unit: string): string {
  return hasNumber(value) ? `${formatNumber(value, digits)}${unit}` : "-";
}

export function idealRangeText(metric: WaterMetric): string {
  if (!hasNumber(metric.idealMin) || !hasNumber(metric.idealMax)) return "";
  const min = formatNumber(metric.idealMin, metric.digits);
  const max = formatNumber(metric.idealMax, metric.digits);
  return metric.idealMin === metric.idealMax ? `${min}${metric.unit}` : `${min}-${max}${metric.unit}`;
}

export function idealRangeNote(value: unknown, metric: WaterMetric): string {
  if (!hasNumber(value) || !hasNumber(metric.idealMin) || !hasNumber(metric.idealMax)) return metric.idealNote || "";
  const number = Number(value);
  if (number < Number(metric.idealMin)) return metric.idealLowNote || metric.idealNote || "권장 범위보다 낮습니다.";
  if (number > Number(metric.idealMax)) return metric.idealHighNote || metric.idealNote || "권장 범위보다 높습니다.";
  return metric.idealOkNote || metric.idealNote || "권장 범위입니다.";
}

export function isWithinIdealRange(value: unknown, metric: WaterMetric): boolean {
  if (!hasNumber(value) || !hasNumber(metric.idealMin) || !hasNumber(metric.idealMax)) return true;
  const number = Number(value);
  return number >= Number(metric.idealMin) && number <= Number(metric.idealMax);
}

export function formatInputValue(value: unknown, digits: number): string {
  if (!hasNumber(value)) return "";
  const number = Number(value);
  return number.toFixed(digits);
}

export const sortedLogs = (waterLogs: WaterLog[]): WaterLog[] =>
  [...waterLogs].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

export const latestLog = (waterLogs: WaterLog[]): WaterLog =>
  sortedLogs(waterLogs).at(-1) || ({} as WaterLog);

export function sortedTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aDue = isValidDateString(a.due) ? a.due : "9999-12-31";
    const bDue = isValidDateString(b.due) ? b.due : "9999-12-31";
    return aDue.localeCompare(bDue);
  });
}

export function tankAquariumType(tank: Tank | null | undefined): AquariumTypeId {
  return tank && aquariumTypes[tank.aquariumType] ? tank.aquariumType : "saltwater";
}

export function currentWaterMetrics(type: AquariumTypeId): WaterMetric[] {
  return waterMetricSets[type] || waterMetricSets.saltwater;
}

// app.js:854-874
export function stabilityScore(log: WaterLog, type: AquariumTypeId): number | null {
  if (!hasNumber(log?.temp)) return null;
  let score = 100;
  const n = (v: unknown) => Number(v);
  if (type === "freshwater") {
    if (hasNumber(log.temp) && (n(log.temp) < 22 || n(log.temp) > 28)) score -= 15;
    if (hasNumber(log.kh) && (n(log.kh) < 2 || n(log.kh) > 10)) score -= 10;
    if (hasNumber(log.no3) && n(log.no3) > 30) score -= 15;
    if (hasNumber(log.nh3) && n(log.nh3) > 0) score -= 20;
  } else {
    if (hasNumber(log.temp) && (n(log.temp) < 24.5 || n(log.temp) > 26.5)) score -= 15;
    if (hasNumber(log.salinity) && (n(log.salinity) < 1.023 || n(log.salinity) > 1.025)) score -= 15;
    if (hasNumber(log.kh) && (n(log.kh) < 7.5 || n(log.kh) > 9.5)) score -= 10;
    if (hasNumber(log.no3) && n(log.no3) > 15) score -= 15;
    if (hasNumber(log.nh3) && n(log.nh3) > 0) score -= 20;
    if (hasNumber(log.po4) && n(log.po4) > 0.1) score -= 15;
  }
  return Math.max(0, score);
}

// app.js:876-881
export function nextDueText(tasks: Task[]): string {
  const task = tasks.filter(t => isValidDateString(t.due)).sort((a, b) => a.due.localeCompare(b.due))[0];
  if (!task) return "등록된 일정 없음";
  const d = daysBetween(task.due, todayIso());
  return `${task.title || "작업명 없음"} · ${d === 0 ? "오늘" : d > 0 ? `${d}일 후` : `${Math.abs(d)}일 지남`}`;
}

// app.js:594-599
export function selectedAquariumBackground(tank: Tank) {
  const fallbackType = tankAquariumType(tank) === "freshwater" ? "담수" : "해수";
  return (
    aquariumBackgrounds.find(background => background.id === tank.aquariumBackground) ||
    aquariumBackgrounds.find(background => background.type === fallbackType) ||
    aquariumBackgrounds[0]
  );
}

// app.js:817-820
export function availableSpecies(type: AquariumTypeId): Species[] {
  const levelOrder: Record<string, number> = { 초급: 0, 중급: 1, 상급: 2 };
  return species
    .filter(item => (item.habitat || "saltwater") === type)
    .sort((a, b) => {
      const levelDiff = (levelOrder[a.level] ?? 99) - (levelOrder[b.level] ?? 99);
      if (levelDiff !== 0) return levelDiff;
      return a.name.localeCompare(b.name, "ko");
    });
}

// app.js:674-700
export function livestockImage(item: Livestock, index = 0, type: AquariumTypeId = "saltwater"): string {
  if (item.image) return item.image;
  const name = item.name || "";
  const match = livestockAssetMap.find(entry => entry.test.test(name));
  if (match) return match.src;
  if (type === "freshwater") return "";
  if (item.type === "무척추") return "assets/livestock/cleaner-shrimp-v2.png";
  if (item.type === "산호") {
    const coralFallbacks = [
      "assets/livestock/anemone.png",
      "assets/livestock/bubble-coral.png",
      "assets/livestock/torch-coral.png",
      "assets/livestock/green-star-polyp.png"
    ];
    return coralFallbacks[index % coralFallbacks.length];
  }
  if (item.type !== "물고기") return "";
  const fallbacks = [
    "assets/livestock/clownfish.png",
    "assets/livestock/yellow-tang.png",
    "assets/livestock/royal-gramma.png",
    "assets/livestock/firefish-goby.png",
    "assets/livestock/mandarin-dragonet.png",
    "assets/livestock/flame-angelfish.png"
  ];
  return fallbacks[index % fallbacks.length];
}

export function livestockMotion(name: string): LivestockMotionPair | null {
  return livestockMotionMap.find(entry => entry.test.test(name))?.motion || null;
}

export type FishDirection = "left" | "right";

export interface FishRouteState {
  x: number;
  y: number;
  direction: FishDirection;
  segmentsRemaining: number;
}

export interface FishWaypoint extends FishRouteState {
  durationMs: number;
}

export function nextFishWaypoint(
  current: FishRouteState,
  random: () => number = Math.random
): FishWaypoint {
  let direction = current.direction;
  let segmentsRemaining = current.segmentsRemaining;

  if (segmentsRemaining <= 0) {
    if (random() < 0.48) direction = direction === "right" ? "left" : "right";
    segmentsRemaining = 2 + Math.floor(random() * 2);
  }

  const distance = 10 + random() * 14;
  const sign = direction === "right" ? 1 : -1;
  let x = current.x + distance * sign;

  if (x < 18 || x > 82) {
    direction = direction === "right" ? "left" : "right";
    segmentsRemaining = 2 + Math.floor(random() * 2);
    x = current.x + distance * (direction === "right" ? 1 : -1);
  }

  x = clamp(x, 18, 82);
  const verticalRange = random() < 0.22 ? 18 : 10;
  const y = clamp(current.y + (random() * 2 - 1) * verticalRange, 18, 80);
  const travel = Math.hypot(x - current.x, (y - current.y) * 0.65);
  const durationMs = Math.round(clamp(travel * (160 + random() * 60), 2800, 6500));

  return {
    x,
    y,
    direction,
    segmentsRemaining: Math.max(0, segmentsRemaining - 1),
    durationMs
  };
}

// app.js:706-716
export function inhabitantKind(type: string): "fish" | "coral" | "invert" {
  if (type === "산호") return "coral";
  if (type === "무척추") return "invert";
  return "fish";
}

export function fishVariant(name: string, index: number): "blue" | "yellow" | "clown" {
  if (name.includes("블루") || name.toLowerCase().includes("blue")) return "blue";
  if (name.includes("옐로우") || name.toLowerCase().includes("yellow")) return "yellow";
  return index % 3 === 1 ? "blue" : index % 3 === 2 ? "yellow" : "clown";
}

// app.js:842-852
export function levelClass(level: string): string {
  return ({ 초급: "beginner", 중급: "intermediate", 상급: "advanced" } as Record<string, string>)[level] || "beginner";
}

export function levelNote(level: string): string {
  return (
    ({
      초급: "안정적인 수질에서 적응이 쉬운 생물입니다.",
      중급: "수조 크기, 합사, 먹이 또는 위치 관리가 필요합니다.",
      상급: "장기 안정화와 전용 관리 경험이 필요합니다."
    } as Record<string, string>)[level] || "난이도 정보를 확인하세요."
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
