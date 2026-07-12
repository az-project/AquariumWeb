import { describe, expect, it } from "vitest";
import { needsStaticAlphaVideoFallback } from "@/lib/media/capabilities";

describe("needsStaticAlphaVideoFallback", () => {
  it("iPhone의 모든 WebKit 브라우저에서는 투명 WebM 대신 정적 이미지를 사용한다", () => {
    expect(
      needsStaticAlphaVideoFallback({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
        maxTouchPoints: 5
      })
    ).toBe(true);

    expect(
      needsStaticAlphaVideoFallback({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 CriOS/138.0 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
        maxTouchPoints: 5
      })
    ).toBe(true);
  });

  it("데스크톱 Safari에서도 VP9 알파 미지원 폴백을 사용한다", () => {
    expect(
      needsStaticAlphaVideoFallback({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 0
      })
    ).toBe(true);
  });

  it("VP9 알파를 지원하는 Chromium 브라우저의 기존 영상은 유지한다", () => {
    expect(
      needsStaticAlphaVideoFallback({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",
        platform: "MacIntel",
        maxTouchPoints: 0
      })
    ).toBe(false);
  });

  it("데스크톱처럼 보이는 iPadOS도 터치 포인트로 판별한다", () => {
    expect(
      needsStaticAlphaVideoFallback({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
        platform: "MacIntel",
        maxTouchPoints: 5
      })
    ).toBe(true);
  });
});
