import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import type { AppUser } from "@/types/next-auth";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:4000/graphql";

/** Decode a JWT payload without verifying the signature (claims only). */
function decodeJwtPayload(jwt: string): Record<string, unknown> {
  try {
    const base64 = jwt.split(".")[1];
    return JSON.parse(Buffer.from(base64, "base64url").toString("utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Extract Keycloak realm roles from a raw access token string. */
function extractRoles(accessToken: string): string[] {
  const payload = decodeJwtPayload(accessToken);
  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  return realmAccess?.roles ?? [];
}

/** Fetch the application-level user from the backend DB using the Keycloak sub as the ID. */
async function fetchAppUser(
  accessToken: string,
  userId: string
): Promise<AppUser | null> {
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: `
          query GetAppUser($id: ID!) {
            user(id: $id) {
              id
              firstName
              lastName
              middleName
              suffix
              profilePictureUrl
              createdAt
              updatedAt
            }
          }
        `,
        variables: { id: userId },
      }),
    });
    const json = await res.json();
    return (json.data?.user as AppUser | null) ?? null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(token: any) {
  try {
    const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    const newAccessToken = refreshedTokens.access_token;
    
    // After token refresh, fetch fresh appUser with new token
    let appUser = null;
    if (token.sub) {
      appUser = await fetchAppUser(newAccessToken, token.sub);
    }

    return {
      ...token,
      accessToken: newAccessToken,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      idToken: refreshedTokens.id_token,
      roles: extractRoles(newAccessToken),
      appUser, // Re-fetched fresh appUser with new token
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
      // Preserve appUser even on error
      appUser: token.appUser ?? null,
    };
  }
}

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: "",  // Public client — no secret
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, trigger }) {
      // Initial sign in — populate appUser for the first time
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at! * 1000;
        // Try to fetch the app user (null if not yet onboarded)
        token.roles = extractRoles(account.access_token!);
        token.appUser = await fetchAppUser(account.access_token!, token.sub!);
        return token;
      }

      // Explicit session update requested (e.g. after completing onboarding)
      // Re-fetch the app user so the session reflects the new DB record
      if (trigger === "update" && token.accessToken && token.sub) {
        token.appUser = await fetchAppUser(
          token.accessToken as string,
          token.sub
        );
        return token;
      }

      // Return previous token if access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        // If appUser is still absent (user completed onboarding after sign-in,
        // or the JWT was cached before this field existed), re-fetch it now.
        // Once populated the condition is false and no further fetches happen.
        if (!token.appUser && token.accessToken && token.sub) {
          token.appUser = await fetchAppUser(
            token.accessToken as string,
            token.sub
          );
        }
        return token;
      }

      // Access token has expired, try to refresh it
      // refreshAccessToken now actively re-fetches appUser with the new token
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
      session.refreshToken = token.refreshToken as string;
      // Carry the app user into the session (null if not yet onboarded)
      session.appUser = token.appUser ?? null;
      session.roles = token.roles ?? [];

      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      if (token.error) {
        session.error = token.error as string;
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // Perform Keycloak logout so the Keycloak session is also terminated
      if (token.idToken) {
        const logoutUrl = new URL(
          `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
        );
        logoutUrl.searchParams.set("id_token_hint", token.idToken as string);
        try {
          await fetch(logoutUrl.toString());
        } catch (err) {
          console.error("Error during Keycloak logout:", err);
        }
      }
    },
  },

});

export { handler as GET, handler as POST };
