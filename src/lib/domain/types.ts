export type AquariumTypeId = "saltwater" | "freshwater";

/** 수질 지표 값 — 지표별로 입력 안 된 값은 null 허용 (optionalNumber) */
export interface WaterLog {
  date: string;
  temp?: number | null;
  salinity?: number | null;
  kh?: number | null;
  ph?: number | null;
  gh?: number | null;
  no3?: number | null;
  nh3?: number | null;
  po4?: number | null;
  no2?: number | null;
}

export interface Task {
  title: string;
  category: string;
  due: string;
  memo?: string;
}

export interface TankPosition {
  x: string;
  y: string;
}

export interface Livestock {
  name: string;
  type: string;
  habitat?: string;
  image?: string;
  status?: string;
  added?: string;
  memo?: string;
  tankPosition?: TankPosition;
}

export interface Equipment {
  name: string;
  status?: string;
  cycle?: string;
}

export interface Tank {
  id: string;
  name: string;
  aquariumType: AquariumTypeId;
  tankStart: string;
  aquariumBackground: string;
  waterLogs: WaterLog[];
  tasks: Task[];
  livestock: Livestock[];
  equipment: Equipment[];
}

/** activeTank 필드를 최상위에 펼친 스냅샷 — 저장 포맷(구버전 앱 롤백 호환)용 */
export interface TankSnapshot {
  name: string;
  aquariumType: AquariumTypeId;
  tankStart: string;
  aquariumBackground: string;
  waterLogs: WaterLog[];
  tasks: Task[];
  livestock: Livestock[];
  equipment: Equipment[];
}

/**
 * data/state.json 영속 포맷. tanks[]가 원본이고 최상위 미러 필드는
 * 바닐라 앱 및 롤백 호환을 위해 직렬화 시 재생성된다.
 */
export interface PersistedState extends TankSnapshot {
  activeTankId: string;
  tanks: Tank[];
}

export interface Species {
  name: string;
  type: string;
  level: string;
  nature: string;
  note: string;
  habitat?: string;
  image: string;
}

export interface WaterMetric {
  key: keyof Omit<WaterLog, "date">;
  label: string;
  unit: string;
  digits: number;
  step: string;
  min: number;
  max: number;
  idealMin?: number;
  idealMax?: number;
  idealNote?: string;
  idealOkNote?: string;
  idealLowNote?: string;
  idealHighNote?: string;
  color: string;
}

export interface AquariumTypeConfig {
  label: string;
  eyebrow: string;
  defaultName: string;
  defaultBackground: string;
  livestockHelp: string;
  secondaryMetric: string;
}

export interface AquariumBackground {
  id: string;
  label: string;
  type: string;
  src: string;
}

export interface NotificationSettings {
  enabled: boolean;
  time: string;
  leadDays: number;
}
