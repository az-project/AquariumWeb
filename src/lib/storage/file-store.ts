// server.js:152-178, 324-345 이식 + 데이터 유실 방지 방어 강화:
//  - write 직전 state.backup-{1..5}.json 로테이션
//  - 최소 스키마 검증 (tanks도 legacy 키도 없으면 거부)
//  - 파싱 실패 시 StateParseError throw (조용히 null 반환 금지)
import fs from "node:fs";
import path from "node:path";
import {
  StateParseError,
  StateValidationError,
  type StateStore,
  type StoredUser,
  type UserStore
} from "./types";
import { hashPassword } from "@/lib/auth/password";

const BACKUP_COUNT = 5;

function dataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

function ensureDataDir(): void {
  fs.mkdirSync(dataDir(), { recursive: true });
}

function atomicWrite(filePath: string, contents: string): void {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, contents, "utf8");
  fs.renameSync(tmpPath, filePath);
}

/** state.json → backup-1, backup-1 → backup-2, ... (최대 5개 유지) */
function rotateBackups(statePath: string): void {
  if (!fs.existsSync(statePath)) return;
  const backupPath = (n: number) => path.join(dataDir(), `state.backup-${n}.json`);
  for (let n = BACKUP_COUNT - 1; n >= 1; n -= 1) {
    if (fs.existsSync(backupPath(n))) fs.renameSync(backupPath(n), backupPath(n + 1));
  }
  fs.copyFileSync(statePath, backupPath(1));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function validateStateShape(state: any): void {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new StateValidationError("상태는 객체여야 합니다.");
  }
  const hasTanks = Array.isArray(state.tanks) && state.tanks.length > 0;
  const hasLegacyKeys = ["waterLogs", "tasks", "livestock", "equipment"].some(key => Array.isArray(state[key]));
  if (!hasTanks && !hasLegacyKeys) {
    throw new StateValidationError("어항 데이터가 없는 상태는 저장할 수 없습니다.");
  }
}

export class FileStateStore implements StateStore {
  private get statePath(): string {
    return path.join(dataDir(), "state.json");
  }

  async read(): Promise<unknown | null> {
    ensureDataDir();
    if (!fs.existsSync(this.statePath)) return null;
    const raw = fs.readFileSync(this.statePath, "utf8");
    try {
      return JSON.parse(raw);
    } catch {
      throw new StateParseError("state.json 파싱에 실패했습니다. 파일을 점검하세요.");
    }
  }

  async write(state: unknown): Promise<void> {
    validateStateShape(state);
    ensureDataDir();
    rotateBackups(this.statePath);
    atomicWrite(this.statePath, `${JSON.stringify(state, null, 2)}\n`);
  }
}

export class FileUserStore implements UserStore {
  private get usersPath(): string {
    return path.join(dataDir(), "users.json");
  }

  private readAll(): StoredUser[] {
    ensureDataDir();
    if (!fs.existsSync(this.usersPath)) return [];
    try {
      const data = JSON.parse(fs.readFileSync(this.usersPath, "utf8"));
      return Array.isArray(data.users) ? data.users : [];
    } catch {
      return [];
    }
  }

  private writeAll(users: StoredUser[]): void {
    ensureDataDir();
    atomicWrite(this.usersPath, `${JSON.stringify({ users }, null, 2)}\n`);
  }

  async ensureSeed(): Promise<void> {
    if (fs.existsSync(this.usersPath)) return;
    const appUsername = process.env.APP_USERNAME || "admin";
    const appPassword = process.env.APP_PASSWORD || "aquarium";
    this.writeAll([
      {
        username: appUsername,
        usernameKey: appUsername.toLowerCase(),
        password: hashPassword(appPassword),
        createdAt: new Date().toISOString()
      }
    ]);
  }

  async findByUsernameKey(usernameKey: string): Promise<StoredUser | null> {
    await this.ensureSeed();
    return this.readAll().find(user => user.usernameKey === usernameKey) || null;
  }

  async create(user: StoredUser): Promise<void> {
    await this.ensureSeed();
    this.writeAll([...this.readAll(), user]);
  }
}
