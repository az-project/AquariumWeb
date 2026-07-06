// app.js:146-177 이식 — localStorage 백업(복구 안전망) + legacy 키 제거.
// 서버가 진실이고 localStorage는 백업/오프라인 폴백이다.
import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from "@/lib/domain/constants";
import type { PersistedState } from "@/lib/domain/types";

const memoryStorage = new Map<string, string>();

export function getStorageItem(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) || null;
  } catch {
    return memoryStorage.get(key) || null;
  }
}

export function setStorageItem(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    memoryStorage.set(key, value);
  }
}

export function removeStorageItem(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    memoryStorage.delete(key);
  }
}

export function removeLegacyKeys(): void {
  LEGACY_STORAGE_KEYS.forEach(removeStorageItem);
}

export function readLocalState(): unknown | null {
  removeLegacyKeys();
  const saved = getStorageItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function writeLocalState(state: PersistedState): void {
  setStorageItem(STORAGE_KEY, JSON.stringify(state));
}
