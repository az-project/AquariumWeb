import { describe, expect, it } from "vitest";
import { livestockMotion, nextFishWaypoint } from "@/lib/domain/derive";

function randomSequence(...values: number[]) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

describe("livestockMotion", () => {
  it("Higgsfield 수영 클립이 있는 클라운피시는 좌우 영상을 모두 반환한다", () => {
    expect(livestockMotion("퍼큘라 클라운")).toEqual({
      left: "assets/livestock/motion/clownfish-left.webm",
      right: "assets/livestock/motion/clownfish-right.webm"
    });
  });

  it("영상이 준비되지 않은 어종은 정적 이미지 폴백을 사용한다", () => {
    expect(livestockMotion("블루탱")).toBeNull();
  });
});

describe("nextFishWaypoint", () => {
  it("남은 연속 구간이 있으면 같은 방향으로 다음 웨이포인트를 만든다", () => {
    const next = nextFishWaypoint(
      { x: 40, y: 50, direction: "right", segmentsRemaining: 2 },
      randomSequence(0.5, 0.5, 0.75, 0.5)
    );

    expect(next.direction).toBe("right");
    expect(next.x).toBeGreaterThan(40);
    expect(next.y).toBeGreaterThan(50);
    expect(next.segmentsRemaining).toBe(1);
    expect(next.durationMs).toBeGreaterThanOrEqual(2800);
  });

  it("수조 경계에 가까우면 즉시 반대 방향으로 돌아선다", () => {
    const next = nextFishWaypoint(
      { x: 86, y: 42, direction: "right", segmentsRemaining: 2 },
      randomSequence(0.6, 0, 0.5, 0.5, 0.5)
    );

    expect(next.direction).toBe("left");
    expect(next.x).toBeLessThan(86);
    expect(next.x).toBeGreaterThanOrEqual(18);
  });

  it("연속 구간이 끝나면 2~3개의 새 방향 구간을 시작하고 높이를 안전 범위로 제한한다", () => {
    const next = nextFishWaypoint(
      { x: 48, y: 78, direction: "left", segmentsRemaining: 0 },
      randomSequence(0.8, 0.9, 0.4, 0.1, 1, 0.5)
    );

    expect(next.direction).toBe("left");
    expect(next.segmentsRemaining).toBe(2);
    expect(next.y).toBeLessThanOrEqual(80);
    expect(next.y).toBeGreaterThanOrEqual(18);
  });
});
