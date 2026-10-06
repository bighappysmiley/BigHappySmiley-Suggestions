import { createNeonAuth } from "@neondatabase/auth/next/server";
import { envVar } from "./kv";

const baseUrl = envVar("NEON_AUTH_BASE_URL");
const cookieSecret = envVar("NEON_AUTH_COOKIE_SECRET");

export const neonAuthConfigured = Boolean(baseUrl && cookieSecret);

export const neonAuth = neonAuthConfigured
  ? createNeonAuth({
      baseUrl: baseUrl!,
      cookies: {
        secret: cookieSecret!,
      },
    })
  : null;
