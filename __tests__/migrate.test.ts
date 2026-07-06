import { describe, expect, it } from "vitest";
import { isDefaultSampleState, migrateState, serializeState } from "@/lib/domain/migrate";
import type { Tank } from "@/lib/domain/types";

/** 운영 state.json과 동형의 픽스처 (2026-07-06 맥미니 실데이터 구조) */
const productionLikeState = {
  activeTankId: "tank-freshwater-1783300238195-4f7ff7",
  tanks: [
    {
      id: "tank-saltwater-main",
      name: "나의 해수어항",
      aquariumType: "saltwater",
      tankStart: "2026-07-04",
      aquariumBackground: "saltwater-open",
      waterLogs: [{ date: "2026-07-05", temp: 25.5, salinity: 34.8, kh: 8.1, no3: 5, nh3: 0, po4: 0.03 }],
      tasks: [],
      livestock: [{ name: "니모", type: "물고기", added: "2026-07-04", status: "건강", memo: "" }],
      equipment: [{ name: "양말필터", status: "정상", cycle: "한달에 1번" }]
    },
    {
      id: "tank-freshwater-1783300238195-4f7ff7",
      name: "담수어항 1",
      aquariumType: "freshwater",
      tankStart: "2026-07-06",
      aquariumBackground: "freshwater-rocks",
      waterLogs: [],
      tasks: [],
      livestock: [],
      equipment: []
    }
  ],
  name: "담수어항 1",
  aquariumType: "freshwater",
  tankStart: "2026-07-06",
  aquariumBackground: "freshwater-rocks",
  waterLogs: [],
  tasks: [],
  livestock: [],
  equipment: []
};

/** 데이터 유실 사고의 원인이었던 구버전 평면 구조 — 반드시 tanks[]로 보존 이관돼야 함 */
const legacyFlatState = {
  tankStart: "2026-06-10",
  aquariumBackground: "saltwater-open",
  waterLogs: [
    { date: "2026-06-01", temp: 25.6, salinity: 34.7, kh: 8.2, no3: 6, nh3: 0, po4: 0.04 },
    { date: "2026-06-12", temp: 25.4, salinity: 34.9, kh: 8.0, no3: 5, nh3: 0, po4: 0.03 }
  ],
  tasks: [{ title: "20% 환수", category: "환수", due: "2026-06-18", memo: "" }],
  livestock: [{ name: "옐로우탱", type: "물고기", added: "2026-06-02", status: "건강", memo: "" }],
  equipment: [{ name: "스키머", status: "정상", cycle: "주 2회" }]
};

describe("migrateState — 데이터 유실 방지 핵심 방어선", () => {
  it("구버전 평면 구조의 waterLogs/livestock/equipment를 전부 보존해 단일 해수탱크로 이관한다", () => {
    const migrated = migrateState(legacyFlatState);
    expect(migrated.tanks).toHaveLength(1);
    const tank = migrated.tanks[0];
    expect(tank.id).toBe("tank-saltwater-main");
    expect(tank.waterLogs).toHaveLength(2);
    expect(tank.waterLogs[0].date).toBe("2026-06-01");
    expect(tank.livestock[0].name).toBe("옐로우탱");
    expect(tank.equipment[0].name).toBe("스키머");
    expect(tank.tasks[0].title).toBe("20% 환수");
    expect(migrated.activeTankId).toBe("tank-saltwater-main");
    // 미러 필드도 보존돼야 구버전 앱이 그대로 읽는다
    expect(migrated.waterLogs).toHaveLength(2);
  });

  it("운영 멀티탱크 구조를 데이터 손실 없이 통과시킨다", () => {
    const migrated = migrateState(productionLikeState);
    expect(migrated.tanks).toHaveLength(2);
    expect(migrated.activeTankId).toBe("tank-freshwater-1783300238195-4f7ff7");
    const saltwater = migrated.tanks.find((t: Tank) => t.id === "tank-saltwater-main")!;
    expect(saltwater.waterLogs).toHaveLength(1);
    expect(saltwater.livestock[0].name).toBe("니모");
    expect(saltwater.equipment[0].name).toBe("양말필터");
  });

  it("activeTankId가 존재하지 않는 탱크를 가리키면 첫 탱크로 보정한다", () => {
    const migrated = migrateState({ ...productionLikeState, activeTankId: "tank-ghost" });
    expect(migrated.activeTankId).toBe("tank-saltwater-main");
  });

  it("null/undefined 입력은 seed 상태를 반환한다", () => {
    const migrated = migrateState(null);
    expect(migrated.tanks).toHaveLength(1);
    expect(migrated.tanks[0].id).toBe("tank-saltwater-main");
    expect(migrated.tanks[0].waterLogs).toHaveLength(0);
  });

  it("데모 샘플 데이터는 seed로 리셋한다", () => {
    const sample = {
      tankStart: "2026-05-20",
      waterLogs: [{ date: "2026-06-01", temp: 25.4 }],
      livestock: [{ name: "니모 1호" }]
    };
    expect(isDefaultSampleState(sample)).toBe(true);
    const migrated = migrateState(sample);
    expect(migrated.tanks[0].waterLogs).toHaveLength(0);
  });

  it("구형 cleaner-shrimp 이미지를 v2로 정규화한다", () => {
    const migrated = migrateState({
      ...legacyFlatState,
      livestock: [{ name: "쉬림프", type: "무척추", image: "assets/livestock/cleaner-shrimp.png" }]
    });
    expect(migrated.tanks[0].livestock[0].image).toBe("assets/livestock/cleaner-shrimp-v2.png");
  });

  it("깨진 타입(배열 아님)의 컬렉션은 빈 배열로 보정하고 throw하지 않는다", () => {
    const migrated = migrateState({ tankStart: "2026-06-01", waterLogs: "corrupt", livestock: 42 });
    expect(migrated.tanks[0].waterLogs).toEqual([]);
    expect(migrated.tanks[0].livestock).toEqual([]);
  });
});

describe("serializeState — 구버전 롤백 호환 미러", () => {
  it("최상위에 activeTank 미러 필드를 재생성한다", () => {
    const migrated = migrateState(productionLikeState);
    const serialized = serializeState("tank-saltwater-main", migrated.tanks);
    expect(serialized.activeTankId).toBe("tank-saltwater-main");
    expect(serialized.name).toBe("나의 해수어항");
    expect(serialized.aquariumType).toBe("saltwater");
    expect(serialized.waterLogs).toHaveLength(1);
    expect(serialized.tanks).toHaveLength(2);
  });

  it("존재하지 않는 activeTankId면 첫 탱크로 직렬화한다", () => {
    const migrated = migrateState(productionLikeState);
    const serialized = serializeState("tank-ghost", migrated.tanks);
    expect(serialized.name).toBe("나의 해수어항");
  });
});
