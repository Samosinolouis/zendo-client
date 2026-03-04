"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import type { AppUser } from "@/types/next-auth";
import { graphqlClient } from "@/lib/graphql-client";
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
  email: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  appUser: AppUser | null;
  isLoggedIn: boolean;
  isOwner: boolean;
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

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status, update: updateSession } = useSession();

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
            email: prev?.email ?? "",
            profilePictureUrl: fetched.profilePictureUrl ?? undefined,
            bannerImageUrl: fetched.bannerImageUrl ?? undefined,
          };
          return {
            ...prev,
            firstName: fetched.firstName ?? prev.firstName,
            lastName: fetched.lastName ?? prev.lastName,
            middleName: fetched.middleName ?? prev.middleName,
            suffix: fetched.suffix ?? prev.suffix,
            profilePictureUrl: fetched.profilePictureUrl ?? prev.profilePictureUrl,
            bannerImageUrl: fetched.bannerImageUrl ?? prev.bannerImageUrl,
          };
        });
      }
    } catch (err) {
      // ignore - keep existing user state
    }
  }, []);

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

      // Always fetch the fresh user record from the API to ensure
      // fields like `profilePictureUrl` (Cloudinary URLs) are up-to-date.
      if (session.user.id) {
        fetchUserFromAPI(session.user.id);
      }
    } else if (status === "unauthenticated") {
      setUser(null);
      setBusinesses([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, appUser, fetchUserFromAPI]);

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
  const isOwner = businesses.length > 0;

  const login = useCallback(() => {
    signIn("keycloak", { callbackUrl: "/onboarding" });
  }, []);

  const logout = useCallback(() => {
    if (status === "authenticated") {
      signOut({ callbackUrl: "/" });
    }
  }, [status]);

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        isLoggedIn,
        isOwner,
        businesses,
        login,
        logout,
        accessToken: (session?.accessToken as string) ?? null,
        status,
        error: (session?.error as string) ?? null,
        refreshBusinesses: fetchBusinesses,
        refreshUser: () => user?.id && fetchUserFromAPI(user.id),
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
