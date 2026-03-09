import "next-auth";
import "next-auth/jwt";

/**
 * The application-level user record stored in the backend database.
 * Populated from the GraphQL `user(id)` query after the user has completed
 * onboarding. Will be `null` for newly authenticated users who have not yet
 * gone through the onboarding flow.
 */
export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  suffix?: string | null;
  profilePictureUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

declare module "next-auth" {
  interface Session {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    error?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    /** Application-level user record from the backend DB (null if not yet onboarded) */
    appUser: AppUser | null;
    /** Keycloak realm roles (e.g. ["ADMIN"]) */
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    /** Application-level user record from the backend DB (null if not yet onboarded) */
    appUser?: AppUser | null;
    /** Keycloak realm roles extracted from the access token */
    roles?: string[];
  }
}
