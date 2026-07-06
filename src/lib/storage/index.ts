// 스토리지 팩토리 — Phase 2에서 STORAGE_DRIVER=supabase 분기를 추가하면
// API 라우트 무수정으로 저장소가 교체된다.
import { FileStateStore, FileUserStore } from "./file-store";
import type { StateStore, UserStore } from "./types";

let stateStore: StateStore | null = null;
let userStore: UserStore | null = null;

export function getStateStore(): StateStore {
  if (!stateStore) {
    stateStore = new FileStateStore();
  }
  return stateStore;
}

export function getUserStore(): UserStore {
  if (!userStore) {
    userStore = new FileUserStore();
  }
  return userStore;
}

export * from "./types";
