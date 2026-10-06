import { appBaseUrl, envVar, getAuthKv, randomToken } from "./kv";

type MagicRecord = {
  email: string;
  createdAt: string;
};

function magicKey(token: string) {
  return `auth:magic:${token}`;
}

export async function createMagicLinkToken(email: string): Promise<string> {
  const kv = await getAuthKv();
  const token = randomToken(32);
  const record: MagicRecord = {
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  await kv.put(magicKey(token), JSON.stringify(record), {
    expirationTtl: 60 * 20,
  });
  return token;
}

export async function consumeMagicLinkToken(
  token: string,
): Promise<string | null> {
  const kv = await getAuthKv();
  const raw = await kv.get(magicKey(token));
  if (!raw) return null;
  await kv.delete(magicKey(token));
  const record = JSON.parse(raw) as MagicRecord;
  return record.email;
}

export async function sendMagicLinkEmail(input: {
  email: string;
  token: string;
  request: Request;
}): Promise<void> {
  const apiKey = envVar("RESEND_API_KEY");
  const from = envVar("EMAIL_FROM");
  if (!apiKey || !from) {
    throw new Error(
      "Email login is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    );
  }

  const verifyUrl = `${appBaseUrl(input.request)}/api/auth/email/verify?token=${encodeURIComponent(input.token)}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: "Sign in to Suggestions",
      text: `Sign in to Suggestions using this link (expires in 20 minutes):\n\n${verifyUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Sign in to <strong>Suggestions</strong> using the link below. This link expires in 20 minutes.</p><p><a href="${verifyUrl}">Sign in to Suggestions</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send magic link email: ${text}`);
  }
}
