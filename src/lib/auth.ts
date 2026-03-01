// ============================================================
// Zendo — Auth Helpers
// Wraps next-auth/react for convenience; also re-exports
// mock helpers for the dev/demo mode.
// ============================================================

import { getSession } from "next-auth/react";

/**
 * Retrieve the Keycloak access token from the current session
 * (client-side only).
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken ?? null;
}

/**
 * Check whether the user has an active NextAuth session.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Get the full session (access token, id token, user, etc.).
 */
export async function getAuthSession() {
  return getSession();
}

