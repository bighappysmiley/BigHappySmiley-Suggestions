import { cookies } from "next/headers";
import { isAdminUser } from "./admin";
import { getAuthKv, randomToken } from "./kv";
import { neonAuth } from "./neon-server";
import type { PublicUser, Session, User } from "./types";
import { getUserById, upsertOAuthUser } from "./users";

const COOKIE_NAME = "suggestions_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sessionKey(token: string) {
  return `auth:session:${token}`;
}

export async function createSession(userId: string): Promise<Session> {
  const kv = await getAuthKv();
  const token = randomToken(32);
  const now = new Date();
  const session: Session = {
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString(),
  };
  await kv.put(sessionKey(token), JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  return session;
}

export async function destroySession(token: string): Promise<void> {
  const kv = await getAuthKv();
  await kv.delete(sessionKey(token));
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

async function getUserFromKvSession(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const kv = await getAuthKv();
  const raw = await kv.get(sessionKey(token));
  if (!raw) return null;
  const session = JSON.parse(raw) as Session;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await kv.delete(sessionKey(token));
    return null;
  }
  return getUserById(session.userId);
}

async function getUserFromNeonSession(): Promise<User | null> {
  if (!neonAuth) return null;
  try {
    const { data: session } = await neonAuth.getSession();
    const neonUser = session?.user;
    if (!neonUser?.id) return null;
    return upsertOAuthUser({
      provider: "email",
      providerAccountId: String(neonUser.id),
      email: neonUser.email ?? null,
      name: neonUser.name || neonUser.email || "Member",
      image: (neonUser.image as string | null | undefined) ?? null,
    });
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const fromKv = await getUserFromKvSession();
  if (fromKv) return fromKv;
  return getUserFromNeonSession();
}

export async function getPublicUser(): Promise<PublicUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    provider: user.provider,
    githubLogin: user.githubLogin,
    isAdmin: isAdminUser(user),
  };
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminUser(user)) {
    throw new AuthError("Admin access required", 403);
  }
  return user;
}

export async function signOutEverywhere(): Promise<void> {
  const token = await getSessionToken();
  if (token) await destroySession(token);
  await clearSessionCookie();
  if (neonAuth) {
    try {
      await neonAuth.signOut();
    } catch {
      // Ignore Neon logout failures when no Neon session exists.
    }
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
