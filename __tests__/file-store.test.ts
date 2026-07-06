import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStateStore, FileUserStore } from "@/lib/storage/file-store";
import { StateParseError, StateValidationError } from "@/lib/storage/types";

let tmpDir: string;
let originalDataDir: string | undefined;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aquarium-store-"));
  originalDataDir = process.env.DATA_DIR;
  process.env.DATA_DIR = tmpDir;
});

afterEach(() => {
  if (originalDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = originalDataDir;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const validState = {
  activeTankId: "tank-saltwater-main",
  tanks: [{ id: "tank-saltwater-main", name: "테스트", aquariumType: "saltwater", waterLogs: [], tasks: [], livestock: [], equipment: [] }]
};

describe("FileStateStore", () => {
  it("write→read 라운드트립이 데이터를 보존한다", async () => {
    const store = new FileStateStore();
    await store.write(validState);
    expect(await store.read()).toEqual(validState);
  });

  it("파일 포맷이 바닐라 서버와 동일하다 (2-space indent + trailing newline)", async () => {
    const store = new FileStateStore();
    await store.write(validState);
    const raw = fs.readFileSync(path.join(tmpDir, "state.json"), "utf8");
    expect(raw).toBe(`${JSON.stringify(validState, null, 2)}\n`);
  });

  it("파일 없으면 null을 반환한다", async () => {
    expect(await new FileStateStore().read()).toBeNull();
  });

  it("빈 객체/데이터 없는 상태는 저장을 거부한다 (유실 사고 방어)", async () => {
    const store = new FileStateStore();
    await expect(store.write({})).rejects.toBeInstanceOf(StateValidationError);
    await expect(store.write(null)).rejects.toBeInstanceOf(StateValidationError);
    await expect(store.write({ tanks: [] })).rejects.toBeInstanceOf(StateValidationError);
  });

  it("legacy 평면 구조(waterLogs 등)는 저장을 허용한다", async () => {
    const store = new FileStateStore();
    await expect(store.write({ waterLogs: [], tasks: [], livestock: [], equipment: [] })).resolves.toBeUndefined();
  });

  it("덮어쓰기 전에 백업을 로테이션한다", async () => {
    const store = new FileStateStore();
    await store.write(validState);
    await store.write({ ...validState, name: "v2" });
    await store.write({ ...validState, name: "v3" });
    const backup1 = JSON.parse(fs.readFileSync(path.join(tmpDir, "state.backup-1.json"), "utf8"));
    const backup2 = JSON.parse(fs.readFileSync(path.join(tmpDir, "state.backup-2.json"), "utf8"));
    expect(backup1.name).toBe("v2"); // 직전 버전
    expect(backup2.name).toBeUndefined(); // 그 전 버전(v1엔 name 없음)
  });

  it("깨진 state.json은 조용히 null이 아니라 StateParseError를 던진다", async () => {
    fs.writeFileSync(path.join(tmpDir, "state.json"), "{ broken", "utf8");
    await expect(new FileStateStore().read()).rejects.toBeInstanceOf(StateParseError);
  });
});

describe("FileUserStore", () => {
  it("users.json이 없으면 env 시드 계정을 생성한다", async () => {
    process.env.APP_USERNAME = "tester";
    process.env.APP_PASSWORD = "secret123";
    const store = new FileUserStore();
    const user = await store.findByUsernameKey("tester");
    expect(user?.username).toBe("tester");
    expect(user?.password.algorithm).toBe("pbkdf2-sha256");
    expect(user?.password.iterations).toBe(120000);
    delete process.env.APP_USERNAME;
    delete process.env.APP_PASSWORD;
  });

  it("기존 users.json 포맷을 그대로 읽는다 (운영 파일 동형 픽스처)", async () => {
    const fixture = {
      users: [
        {
          username: "saranghe41",
          usernameKey: "saranghe41",
          password: {
            algorithm: "pbkdf2-sha256",
            iterations: 120000,
            salt: "f9358a91def24cd7eed0a918f7665c9f",
            hash: "c0d5678c5f4eeb631be14393f85579a5bb3846148e1051b815e1b54ff8933202"
          },
          createdAt: "2026-07-03T04:56:45.378Z"
        }
      ]
    };
    fs.writeFileSync(path.join(tmpDir, "users.json"), JSON.stringify(fixture, null, 2), "utf8");
    const user = await new FileUserStore().findByUsernameKey("saranghe41");
    expect(user?.username).toBe("saranghe41");
    expect(user?.password.salt).toBe("f9358a91def24cd7eed0a918f7665c9f");
  });
});
