export interface StoredUser {
  username: string;
  usernameKey: string;
  password: {
    algorithm: string;
    iterations: number;
    salt: string;
    hash: string;
  };
  createdAt: string;
}

/**
 * 상태 저장소 인터페이스. Phase 1은 파일 구현(file-store.ts),
 * Phase 2에서 Supabase 구현으로 교체한다 (index.ts 팩토리만 변경).
 */
export interface StateStore {
  /** 저장된 원본 JSON. 파일 없음 → null. 파싱 실패 → throw (조용히 null 금지 — seed 덮어쓰기 사고 방지) */
  read(): Promise<unknown | null>;
  /** 원자적 쓰기 + 백업 로테이션 */
  write(state: unknown): Promise<void>;
}

export interface UserStore {
  findByUsernameKey(usernameKey: string): Promise<StoredUser | null>;
  create(user: StoredUser): Promise<void>;
  /** 저장소가 비어있으면 env 시드 계정 생성 */
  ensureSeed(): Promise<void>;
}

export class StateParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateParseError";
  }
}

export class StateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateValidationError";
  }
}
