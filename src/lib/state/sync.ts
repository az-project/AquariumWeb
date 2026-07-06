// app.js:335-357 이식 — 350ms 디바운스 서버 저장.
// applyingSharedState 플래그는 스토어가 hydrate 액션에서 persist를 스케줄하지
// 않는 방식으로 대체됐다 (구독이 아닌 액션 기반이라 플래그 불필요).
import type { PersistedState } from "@/lib/domain/types";

const SHARED_STATE_ENDPOINT = "/api/state";
const DEBOUNCE_MS = 350;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export type PersistResult = "ok" | "unauthorized" | "error";

export async function putSharedState(state: PersistedState): Promise<PersistResult> {
  try {
    const response = await fetch(SHARED_STATE_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
    if (response.status === 401) return "unauthorized";
    return response.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

export function scheduleSharedStateSave(
  getSnapshot: () => PersistedState,
  onResult: (result: PersistResult) => void
): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    onResult(await putSharedState(getSnapshot()));
  }, DEBOUNCE_MS);
}

export function cancelScheduledSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
}

export async function fetchSharedState(): Promise<{ status: number; data: unknown | null }> {
  const response = await fetch(SHARED_STATE_ENDPOINT, { cache: "no-store" });
  if (!response.ok) return { status: response.status, data: null };
  return { status: response.status, data: await response.json() };
}
