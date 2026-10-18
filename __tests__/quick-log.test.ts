import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { mergeWaterLog, parseQuickLogText, todayInTimeZone } from "@/lib/shortcut/quick-log";
import { POST } from "../app/api/quick-log/route";

const TODAY = "2026-10-18";

describe("parseQuickLogText", () => {
  it("받아쓰기 문장에서 날짜와 수치를 뽑는다", () => {
    expect(parseQuickLogText("오늘 인산염 0.01 질산염 3.0", TODAY)).toEqual({ date: TODAY, values: { po4: 0.01, no3: 3 } });
  });

  it("아질산염을 질산염으로 오인하지 않는다", () => {
    expect(parseQuickLogText("질산염 5 아질산염 0.1", TODAY).values).toEqual({ no3: 5, no2: 0.1 });
  });

  it("어제, 영문 표기, 쉼표, 단위를 처리한다", () => {
    expect(parseQuickLogText("어제 PO4 0.03ppm, NO3 10, KH 8.2 염도 1.025", TODAY)).toEqual({
      date: "2026-10-17",
      values: { po4: 0.03, no3: 10, kh: 8.2, salinity: 1.025 }
    });
  });

  it("한글로 읽은 숫자를 처리한다", () => {
    expect(parseQuickLogText("인산염 영점영일 질산염 삼점영 온도 이십오", TODAY).values).toEqual({ po4: 0.01, no3: 3, temp: 25 });
  });

  it("날짜를 말하지 않으면 date가 없다", () => {
    expect(parseQuickLogText("인산염은 0.02", TODAY)).toEqual({ values: { po4: 0.02 } });
  });

  it("수치가 없으면 빈 값을 돌려준다", () => {
    expect(parseQuickLogText("안녕하세요", TODAY).values).toEqual({});
  });
});

describe("mergeWaterLog", () => {
  it("같은 날짜의 다른 항목을 유지한다", () => {
    const { log } = mergeWaterLog([{ date: TODAY, temp: 25, po4: 0.1 }], TODAY, { po4: 0.01, no3: 3 });
    expect(log).toEqual({ date: TODAY, temp: 25, po4: 0.01, no3: 3 });
  });
});

describe("todayInTimeZone", () => {
  it("서울 기준 날짜를 계산한다", () => {
    expect(todayInTimeZone("Asia/Seoul", new Date("2026-10-17T16:00:00Z"))).toBe("2026-10-18");
  });
});

describe("POST /api/quick-log", () => {
  let tmpDir: string;
  const env = { ...process.env };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aquarium-quicklog-"));
    process.env.DATA_DIR = tmpDir;
    process.env.STORAGE_DRIVER = "file";
    process.env.REEFLOG_SHORTCUT_TOKEN = "secret-token";
    fs.writeFileSync(path.join(tmpDir, "state.json"), JSON.stringify({
      activeTankId: "t1",
      tanks: [{ id: "t1", name: "테스트", aquariumType: "saltwater", waterLogs: [{ date: "2026-01-01", temp: 25, po4: 0.1 }], tasks: [], livestock: [], equipment: [] }]
    }));
  });

  afterEach(() => {
    process.env = { ...env };
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function call(body: unknown, token = "secret-token") {
    return POST(new Request("http://localhost/api/quick-log", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    }) as unknown as NextRequest);
  }

  it("잘못된 토큰을 거부한다", async () => {
    expect((await call({ text: "인산염 0.01" }, "wrong")).status).toBe(401);
  });

  it("문장을 저장하고 기존 값과 합친다", async () => {
    const response = await call({ text: "인산염 0.01 질산염 3.0", date: "2026-01-01" });
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.message).toBe("2026-01-01 질산염 3, 인산염 0.01 저장했어요.");
    const state = JSON.parse(fs.readFileSync(path.join(tmpDir, "state.json"), "utf8"));
    expect(state.tanks[0].waterLogs).toEqual([{ date: "2026-01-01", temp: 25, po4: 0.01, no3: 3 }]);
  });

  it("수치가 없으면 400과 안내 문장을 준다", async () => {
    const response = await call({ text: "안녕" });
    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain("수치를 찾지 못했어요");
  });
});
