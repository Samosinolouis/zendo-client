// ============================================================
// Zendo — GraphQL Client (fetch-based, no external library)
// Sends requests to the GraphQL API with the Keycloak access
// token from the NextAuth session.
// ============================================================

import { getSession } from "next-auth/react";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:4000/graphql";

export interface GraphQLError {
  message: string;
  extensions?: {
    type?: string;
    status?: number;
    code?: string;
    details?: Record<string, unknown>;
  };
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
}

/**
 * Execute a GraphQL operation against the API.
 *
 * Automatically attaches the current Keycloak access token as a
 * Bearer token in the Authorization header.
 */
export async function graphqlClient<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>> {
  const session = await getSession();
  const token = session?.accessToken;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json: GraphQLResponse<T> = await res.json();
  return json;
}
