"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import type { User, Business } from "@/types";
import type { AppUser } from "@/types/next-auth";
import { mockUsers, getBusinessesByUserId } from "@/lib/mock-data";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: "user" | "owner";
  businessName?: string;
  businessDescription?: string;
}

interface AuthContextType {
  user: User | null;
  /**
   * The application-level user record from the backend database.
   * `null` when the user has not yet completed onboarding.
   */
  appUser: AppUser | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  businesses: Business[];
  /** Redirect to Keycloak login */
  login: () => void;
  /** Sign out of both NextAuth and Keycloak */
  logout: () => void;
  /** Access token from Keycloak (JWT) */
  accessToken: string | null;
  /** Session status: "loading" | "authenticated" | "unauthenticated" */
  status: string;
  /** If the session has a token-refresh error */
  error: string | null;
  // --- Legacy mock helpers (kept for dev/demo mode) ---
  switchUser: (userId: string) => void;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  isLoggedIn: false,
  isOwner: false,
  businesses: [],
  login: () => {},
  logout: () => {},
  accessToken: null,
  status: "loading",
  error: null,
  switchUser: () => {},
  register: async () => ({ success: false, message: "" }),
  loginWithCredentials: async () => ({ success: false, message: "" }),
});

/* ------------------------------------------------------------------ */
/*  Inner provider — consumes the NextAuth session                     */
/* ------------------------------------------------------------------ */

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Build a User object from the Keycloak session when available
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<User | null>(null);

  // The application-level user record from the backend DB
  const appUser: AppUser | null = session?.appUser ?? null;

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Use appUser data (backend DB record) when available for richer name/avatar info.
      // Fall back to Keycloak claims if the user is not yet onboarded.
      const nameParts = (session.user.name ?? "").split(" ");
      const keycloakUser: User = {
        id: session.user.id ?? "",
        firstName: appUser?.firstName ?? nameParts[0] ?? "",
        lastName: appUser?.lastName ?? nameParts.slice(1).join(" ") ?? "",
        email: session.user.email ?? "",
        username: session.user.email ?? "",
        profilePictureUrl: appUser?.profilePictureUrl ?? session.user.image ?? undefined,
        role: "user", // Backend will eventually provide this
      };
      setUser(keycloakUser);
      setDemoUser(null); // Clear demo user when real session active
    } else if (status === "unauthenticated") {
      setUser(demoUser); // Fall back to demo user if set
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, appUser]);

  const activeUser = status === "authenticated" ? user : demoUser;
  const isLoggedIn = activeUser !== null;
  const isOwner = activeUser?.role === "owner";
  const businesses = activeUser ? getBusinessesByUserId(activeUser.id) : [];

  /* Keycloak login via NextAuth */
  const login = useCallback(() => {
    signIn("keycloak", { callbackUrl: "/onboarding" });
  }, []);

  /* Keycloak + NextAuth sign-out */
  const logout = useCallback(() => {
    if (status === "authenticated") {
      signOut({ callbackUrl: "/" });
    }
    setDemoUser(null);
  }, [status]);

  /* --- Legacy / Demo helpers ---------------------------------------- */

  const switchUser = useCallback((userId: string) => {
    const target = mockUsers.find((u) => u.id === userId);
    setDemoUser(target ?? null);
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
      void password;
      await new Promise((r) => setTimeout(r, 600));
      const found = mockUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (found) {
        setDemoUser(found);
        return { success: true, message: "Welcome back!" };
      }
      return { success: false, message: "Invalid email or password. Try any mock user's email." };
    },
    []
  );

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    await new Promise((r) => setTimeout(r, 800));
    const exists = mockUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      return { success: false, message: "An account with this email already exists." };
    }
    const newUser: User = {
      id: `u${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      username: data.username,
      profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.firstName}`,
      role: data.role,
    };
    mockUsers.push(newUser);
    setDemoUser(newUser);
    return { success: true, message: `Account created! Welcome to Zendo, ${data.firstName}.` };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        appUser,
        isLoggedIn,
        isOwner,
        businesses,
        login,
        logout,
        accessToken: (session?.accessToken as string) ?? null,
        status,
        error: (session?.error as string) ?? null,
        switchUser,
        register,
        loginWithCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported wrapper — includes SessionProvider                        */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
