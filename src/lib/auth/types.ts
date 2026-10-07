export type AuthProvider = "github" | "bhs" | "email";

export type User = {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
  provider: AuthProvider;
  providerAccountId: string;
  githubLogin: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type PublicUser = {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
  provider: AuthProvider;
  githubLogin: string | null;
  isAdmin: boolean;
};

export type AuthConfigStatus = {
  githubConfigured: boolean;
  bhsConfigured: boolean;
  emailConfigured: boolean;
  appUrl: string;
};
