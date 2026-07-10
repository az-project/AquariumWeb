import { describe, expect, it } from "vitest";
import { livestockMotion } from "@/lib/domain/derive";

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
