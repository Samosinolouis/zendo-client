// ============================================================
// Zendo — Centralised environment configuration
// Import from here instead of reading process.env directly.
// ============================================================

// --------------- Public (browser-safe) ---------------

export const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:4000/graphql";

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

// --------------- Server-only -------------------------

export const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? "";

export const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER ?? "";

export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? "";

// Logs all config values except secrets, to verify they're loading correctly.
console.log("Config:");
console.log("GRAPHQL_ENDPOINT:", GRAPHQL_ENDPOINT);
console.log("CLOUDINARY_CLOUD_NAME:", CLOUDINARY_CLOUD_NAME ? "[redacted]" : "(not set)");
console.log("CLOUDINARY_UPLOAD_PRESET:", CLOUDINARY_UPLOAD_PRESET ? "[redacted]" : "(not set)");
console.log("KEYCLOAK_CLIENT_ID:", KEYCLOAK_CLIENT_ID ? "[redacted]" : "(not set)");
console.log("KEYCLOAK_ISSUER:", KEYCLOAK_ISSUER ? "[redacted]" : "(not set)");
console.log("NEXTAUTH_SECRET:", NEXTAUTH_SECRET ? "[redacted]" : "(not set)");