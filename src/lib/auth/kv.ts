import { getCloudflareContext } from "@opennextjs/cloudflare";

type KvLike = {
  get(key: string, type?: "text" | "json"): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
};

export async function getAuthKv(): Promise<KvLike> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as { SUGGESTIONS_KV?: KvLike }).SUGGESTIONS_KV;
    if (kv) return kv;
  } catch {
    // Local next dev without Workers bindings.
  }
  return memoryKv;
}

const memory = new Map<string, { value: string; expiresAt?: number }>();

const memoryKv: KvLike = {
  async get(key) {
    const entry = memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memory.delete(key);
      return null;
    }
    return entry.value;
  },
  async put(key, value, options) {
    memory.set(key, {
      value,
      expiresAt: options?.expirationTtl
        ? Date.now() + options.expirationTtl * 1000
        : undefined,
    });
  },
  async delete(key) {
    memory.delete(key);
  },
};

export function envVar(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export function requireEnv(name: string): string {
  const value = envVar(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function appBaseUrl(request?: Request): string {
  const configured = envVar("APP_URL") || envVar("BETTER_AUTH_URL");
  if (configured) return configured.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}

export function randomToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function id(prefix: string): string {
  return `${prefix}_${randomToken(12)}`;
}
