import { hashPassword } from "@/lib/auth/password";
import { validateStateShape } from "./file-store";
import {
  StateParseError,
  type StateStore,
  type StoredUser,
  type UserStore
} from "./types";

const DEFAULT_STATE_KEY = "default";

interface SupabaseConfig {
  url: string;
  key: string;
  stateKey: string;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function readConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return {
    url: trimTrailingSlash(url),
    key,
    stateKey: process.env.SUPABASE_STATE_KEY || DEFAULT_STATE_KEY
  };
}

export function hasSupabaseStorageConfig(): boolean {
  return Boolean(readConfig());
}

function requireConfig(): SupabaseConfig {
  const config = readConfig();
  if (!config) {
    throw new Error("Supabase storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return config;
}

class SupabaseRestClient {
  constructor(private readonly config: SupabaseConfig) {}

  private endpoint(path: string, query = ""): string {
    return `${this.config.url}/rest/v1/${path}${query}`;
  }

  private headers(extra?: HeadersInit): Headers {
    const headers = new Headers(extra);
    headers.set("apikey", this.config.key);
    headers.set("Authorization", `Bearer ${this.config.key}`);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return headers;
  }

  async request<T>(path: string, init: RequestInit = {}, query = ""): Promise<T> {
    const response = await fetch(this.endpoint(path, query), {
      ...init,
      headers: this.headers(init.headers)
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `Supabase request failed with ${response.status}`);
    }
    return (text ? JSON.parse(text) : null) as T;
  }
}

export class SupabaseStateStore implements StateStore {
  private readonly config = requireConfig();
  private readonly client = new SupabaseRestClient(this.config);

  async read(): Promise<unknown | null> {
    const rows = await this.client.request<{ value: unknown }[]>(
      "app_state",
      { method: "GET" },
      `?key=eq.${encodeURIComponent(this.config.stateKey)}&select=value&limit=1`
    );
    if (!rows.length) return null;
    const value = rows[0]?.value;
    if (value === undefined) {
      throw new StateParseError("Supabase app_state row does not contain a value field.");
    }
    return value;
  }

  async write(state: unknown): Promise<void> {
    validateStateShape(state);
    await this.client.request("app_state", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        key: this.config.stateKey,
        value: state,
        updated_at: new Date().toISOString()
      })
    }, "?on_conflict=key");
  }
}

export class SupabaseUserStore implements UserStore {
  private readonly client = new SupabaseRestClient(requireConfig());
  private seedEnsured = false;

  async ensureSeed(): Promise<void> {
    if (this.seedEnsured) return;
    const appUsername = process.env.APP_USERNAME || "admin";
    const usernameKey = appUsername.toLowerCase();
    const existing = await this.findUserByUsernameKey(usernameKey);
    if (existing) {
      this.seedEnsured = true;
      return;
    }

    const appPassword = process.env.APP_PASSWORD || "aquarium";
    await this.create({
      username: appUsername,
      usernameKey,
      password: hashPassword(appPassword),
      createdAt: new Date().toISOString()
    });
    this.seedEnsured = true;
  }

  async findByUsernameKey(usernameKey: string): Promise<StoredUser | null> {
    await this.ensureSeed();
    return this.findUserByUsernameKey(usernameKey);
  }

  private async findUserByUsernameKey(usernameKey: string): Promise<StoredUser | null> {
    const rows = await this.client.request<Array<{
      username: string;
      username_key: string;
      password: StoredUser["password"];
      created_at: string;
    }>>(
      "app_users",
      { method: "GET" },
      `?username_key=eq.${encodeURIComponent(usernameKey)}&select=username,username_key,password,created_at&limit=1`
    );
    const row = rows[0];
    if (!row) return null;
    return {
      username: row.username,
      usernameKey: row.username_key,
      password: row.password,
      createdAt: row.created_at
    };
  }

  async create(user: StoredUser): Promise<void> {
    await this.client.request("app_users", {
      method: "POST",
      body: JSON.stringify({
        username: user.username,
        username_key: user.usernameKey,
        password: user.password,
        created_at: user.createdAt
      })
    });
  }
}
