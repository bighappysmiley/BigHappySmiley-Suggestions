import { getAuthKv, id } from "./kv";
import type { AuthProvider, User } from "./types";

function userKey(userId: string) {
  return `auth:user:${userId}`;
}

function accountKey(provider: AuthProvider, providerAccountId: string) {
  return `auth:account:${provider}:${providerAccountId}`;
}

function emailKey(email: string) {
  return `auth:email:${email.toLowerCase()}`;
}

export async function getUserById(userId: string): Promise<User | null> {
  const kv = await getAuthKv();
  const raw = await kv.get(userKey(userId));
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function upsertOAuthUser(input: {
  provider: AuthProvider;
  providerAccountId: string;
  email: string | null;
  name: string;
  image: string | null;
  githubLogin?: string | null;
}): Promise<User> {
  const kv = await getAuthKv();
  const existingId = await kv.get(
    accountKey(input.provider, input.providerAccountId),
  );
  const now = new Date().toISOString();

  if (existingId) {
    const existing = await getUserById(existingId);
    if (existing) {
      const updated: User = {
        ...existing,
        email: input.email ?? existing.email,
        name: input.name || existing.name,
        image: input.image ?? existing.image,
        githubLogin: input.githubLogin ?? existing.githubLogin,
        updatedAt: now,
      };
      await kv.put(userKey(existing.id), JSON.stringify(updated));
      if (updated.email) {
        await kv.put(emailKey(updated.email), updated.id);
      }
      return updated;
    }
  }

  if (input.email) {
    const byEmail = await kv.get(emailKey(input.email));
    if (byEmail) {
      const existing = await getUserById(byEmail);
      if (existing) {
        const updated: User = {
          ...existing,
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          name: input.name || existing.name,
          image: input.image ?? existing.image,
          githubLogin: input.githubLogin ?? existing.githubLogin,
          updatedAt: now,
        };
        await kv.put(userKey(existing.id), JSON.stringify(updated));
        await kv.put(
          accountKey(input.provider, input.providerAccountId),
          existing.id,
        );
        return updated;
      }
    }
  }

  const user: User = {
    id: id("usr"),
    email: input.email,
    name: input.name || input.email || "User",
    image: input.image,
    provider: input.provider,
    providerAccountId: input.providerAccountId,
    githubLogin: input.githubLogin ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await kv.put(userKey(user.id), JSON.stringify(user));
  await kv.put(accountKey(input.provider, input.providerAccountId), user.id);
  if (user.email) await kv.put(emailKey(user.email), user.id);
  return user;
}

export async function upsertEmailUser(email: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const kv = await getAuthKv();
  const existingId = await kv.get(emailKey(normalized));
  if (existingId) {
    const existing = await getUserById(existingId);
    if (existing) return existing;
  }
  return upsertOAuthUser({
    provider: "email",
    providerAccountId: normalized,
    email: normalized,
    name: normalized.split("@")[0] || normalized,
    image: null,
  });
}
