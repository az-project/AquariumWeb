import { FileStateStore, FileUserStore } from "./file-store";
import { hasSupabaseStorageConfig, SupabaseStateStore, SupabaseUserStore } from "./supabase-store";
import type { StateStore, UserStore } from "./types";

let stateStore: StateStore | null = null;
let userStore: UserStore | null = null;

function shouldUseSupabaseStorage(): boolean {
  if (process.env.STORAGE_DRIVER === "supabase") return true;
  if (process.env.STORAGE_DRIVER === "file") return false;
  return hasSupabaseStorageConfig();
}

export function getStateStore(): StateStore {
  if (!stateStore) {
    stateStore = shouldUseSupabaseStorage() ? new SupabaseStateStore() : new FileStateStore();
  }
  return stateStore;
}

export function getUserStore(): UserStore {
  if (!userStore) {
    userStore = shouldUseSupabaseStorage() ? new SupabaseUserStore() : new FileUserStore();
  }
  return userStore;
}

export * from "./types";
