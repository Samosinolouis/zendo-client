"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import type { AppUser } from "@/types/next-auth";
import { graphqlClient, setAccessToken } from "@/lib/graphql-client";
import { GET_BUSINESSES, GET_USER } from "@/graphql/queries";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Business {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
}

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  mobileNumber?: string;
  isBusinessOwner?: boolean;
  email: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  appUser: AppUser | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  businesses: Business[];
  login: () => void;
  logout: () => void;
  accessToken: string | null;
  status: string;
  error: string | null;
  refreshBusinesses: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  isLoggedIn: false,
  isOwner: false,
  isAdmin: false,
  businesses: [],
  login: () => {},
  logout: () => {},
  accessToken: null,
  status: "loading",
  error: null,
  refreshBusinesses: () => {},
  refreshUser: () => {},
});

/* ------------------------------------------------------------------ */
/*  Inner provider — consumes the NextAuth session                     */
/* ------------------------------------------------------------------ */

function AuthProviderInner({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, status } = useSession();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const appUser: AppUser | null = session?.appUser ?? null;

  const fetchBusinesses = useCallback(async () => {
    // Use appUser.id if available, otherwise try from user state
    const userId = appUser?.id || user?.id;
    if (!userId) {
      setBusinesses([]);
      return;
    }
    try {
      const res = await graphqlClient<{
        businesses: { edges: Array<{ node: Business }> };
      }>(GET_BUSINESSES, { first: 50, filter: { userId } });
      const nodes = res.data?.businesses?.edges?.map((e) => e.node) ?? [];
      setBusinesses(nodes);
    } catch (err) {
      console.error("Failed to fetch businesses:", err);
      setBusinesses([]);
    }
  }, [appUser?.id, user?.id]);

  const fetchUserFromAPI = useCallback(async (userId: string) => {
    try {
      const res = await graphqlClient<{ user: Partial<AuthUser> }>(GET_USER, { id: userId });
      const fetched = res.data?.user;
      if (fetched) {
        setUser((prev) => {
          if (!prev) return {
            id: fetched.id ?? userId ?? "",
            firstName: fetched.firstName ?? "",
            lastName: fetched.lastName ?? "",
            middleName: fetched.middleName ?? undefined,
            suffix: fetched.suffix ?? undefined,
            mobileNumber: fetched.mobileNumber ?? undefined,
            isBusinessOwner: fetched.isBusinessOwner ?? undefined,
            email: fetched.email ?? "",
            profilePictureUrl: fetched.profilePictureUrl ?? undefined,
            bannerImageUrl: fetched.bannerImageUrl ?? undefined,
          };
          return {
            ...prev,
            firstName: fetched.firstName ?? prev.firstName,
            lastName: fetched.lastName ?? prev.lastName,
            middleName: fetched.middleName ?? prev.middleName,
            suffix: fetched.suffix ?? prev.suffix,
            mobileNumber: fetched.mobileNumber ?? prev.mobileNumber,
            isBusinessOwner: fetched.isBusinessOwner ?? prev.isBusinessOwner,
            profilePictureUrl: fetched.profilePictureUrl ?? prev.profilePictureUrl,
            bannerImageUrl: fetched.bannerImageUrl ?? prev.bannerImageUrl,
          };
        });
      }
    } catch (err) {
      // ignore - keep existing user state
      console.error("Failed to fetch user from API", err);
    }
  }, []);

  // Keep the graphqlClient token cache in sync without calling getSession().
  // This MUST happen before any GraphQL calls are made, so it runs on every
  // accessToken change rather than being batched into the user-setup effect.
  useEffect(() => {
    setAccessToken((session?.accessToken as string) ?? null);
  }, [session?.accessToken]);

  // Track the last user ID for which we fetched user data to avoid
  // re-fetching on every session object reference change (which would
  // re-trigger the cross-tab broadcast loop via graphqlClient → getSession).
  const lastFetchedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const nameParts = (session.user.name ?? "").split(" ");
      setUser({
        id: session.user.id ?? "",
        firstName: appUser?.firstName ?? nameParts[0] ?? "",
        lastName: appUser?.lastName ?? nameParts.slice(1).join(" ") ?? "",
        middleName: appUser?.middleName ?? undefined,
        suffix: appUser?.suffix ?? undefined,
        email: session.user.email ?? "",
        profilePictureUrl: appUser?.profilePictureUrl ?? session.user.image ?? undefined,
      });

      // Only fetch the fresh user record when the user ID changes (i.e. on
      // sign-in or account switch), not on every session object re-creation.
      const userId = session.user.id ?? null;
      if (userId && userId !== lastFetchedUserIdRef.current) {
        lastFetchedUserIdRef.current = userId;
        fetchUserFromAPI(userId);
      }
    } else if (status === "unauthenticated") {
      lastFetchedUserIdRef.current = null;
      setUser(null);
      setBusinesses([]);
    }
    // If the session has a token refresh error, force sign-out so the user
    // gets redirected to Keycloak for a fresh login instead of being stuck
    // with a session that has no valid accessToken.
    if (status === "authenticated" && (session as any)?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id, session?.user?.email, appUser?.firstName, appUser?.lastName, appUser?.profilePictureUrl, fetchUserFromAPI]);

  useEffect(() => {
    if (status === "authenticated") {
      const userId = appUser?.id || user?.id;
      if (userId) {
        // Initial fetch
        fetchBusinesses();

        // Set up a periodic refresh every 5 minutes to catch any newly created businesses
        // and to ensure the list doesn't become stale
        const interval = setInterval(fetchBusinesses, 5 * 60 * 1000);
        return () => clearInterval(interval);
      }
    }
  }, [status, appUser?.id, user?.id, fetchBusinesses]);

  const isLoggedIn = status === "authenticated" && user !== null;
  const isOwner = user?.isBusinessOwner === true;
  const isAdmin = (session?.roles ?? []).includes("admin");

  const login = useCallback(() => {
    signIn("keycloak", { callbackUrl: "/onboarding" });
  }, []);

  const logout = useCallback(() => {
    if (status === "authenticated") {
      signOut({ callbackUrl: "/" });
    }
  }, [status]);

  const contextValue = useMemo(() => ({
    user,
    appUser,
    isLoggedIn,
    isOwner,
    isAdmin,
    businesses,
    login,
    logout,
    accessToken: (session?.accessToken as string) ?? null,
    status,
    error: (session?.error as string) ?? null,
    refreshBusinesses: () => { void fetchBusinesses(); },
    refreshUser: () => { if (user?.id) void fetchUserFromAPI(user.id); },
  }), [user, appUser, isLoggedIn, isOwner, isAdmin, businesses, login, logout, session, status, fetchBusinesses, fetchUserFromAPI]);

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported wrapper — includes SessionProvider                        */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // refetchOnWindowFocus=false prevents a session re-fetch (and its storage
    // broadcast) every time the user switches browser tabs, which was the
    // second trigger of the cross-tab infinite re-auth loop.
    <SessionProvider refetchOnWindowFocus={false}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
