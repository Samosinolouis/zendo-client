// ============================================================
// Zendo — Keycloak Auth Wrapper (Placeholder)
// This module exposes the auth interface the app will use.
// Currently returns mock data; will be replaced with real
// Keycloak integration once the backend is ready.
// ============================================================

import type { User } from "@/types";
import { mockUsers } from "@/lib/mock-data";

// Toggle this to simulate different logged-in users
// "u1" = normal user (Jane), "u2" = business owner (Carlos)
const MOCK_CURRENT_USER_ID = "u1";

/** Placeholder — will call Keycloak's init / login */
export async function keycloakLogin(): Promise<void> {
  console.log("[Keycloak Placeholder] login() called – would redirect to Keycloak login page");
}

/** Placeholder — will call Keycloak's logout */
export async function keycloakLogout(): Promise<void> {
  console.log("[Keycloak Placeholder] logout() called – would redirect to Keycloak logout");
}

/** Placeholder — returns a mock access token */
export function getAccessToken(): string | null {
  return "mock-access-token-xyz";
}

/** Placeholder — checks if user is authenticated */
export function isAuthenticated(): boolean {
  return true; // Always true in mock mode
}

/** Returns the currently "logged in" mock user */
export function getCurrentUser(): User | null {
  return mockUsers.find((u) => u.id === MOCK_CURRENT_USER_ID) ?? null;
}

/** Check if the current mock user is a business owner */
export function isBusinessOwner(): boolean {
  const user = getCurrentUser();
  return user?.role === "owner";
}

/** Placeholder — will refresh Keycloak token */
export async function refreshToken(): Promise<string | null> {
  console.log("[Keycloak Placeholder] refreshToken() called");
  return getAccessToken();
}
