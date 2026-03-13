// ============================================================
// Zendo — GraphQL Client (fetch-based, no external library)
// Sends requests to the GraphQL API with the Keycloak access
// token from the NextAuth session.
// ============================================================

import { GRAPHQL_ENDPOINT } from "@/lib/config";

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
 * Module-level token cache updated by AuthProvider.
 * Using a cached token avoids calling getSession() on every request,
 * which would broadcast a storage event to all other tabs and cause
 * an infinite cross-tab re-authentication loop.
 */
let _cachedAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _cachedAccessToken = token;
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
  const token = _cachedAccessToken;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const text = await res.text();

    // Try parse JSON body; if parsing fails, return a parse error
    try {
      const json: GraphQLResponse<T> = text ? JSON.parse(text) : {};

      if (!res.ok) {
        return {
          errors: [
            {
              message: json?.errors ? 'GraphQL errors' : res.statusText || 'HTTP error',
              extensions: {
                type: 'http',
                status: res.status,
                details: json as Record<string, unknown>,
              },
            },
          ],
        };
      }

      return json;
    } catch {
      return {
        errors: [
          {
            message: 'Failed to parse response from server',
            extensions: { type: 'parse', status: res.status, details: { body: text } },
          },
        ],
      };
    }
  } catch (err: any) {
    return {
      errors: [
        {
          message: err?.message ?? 'Network error while contacting GraphQL endpoint',
          extensions: { type: 'network', details: { message: err?.message } },
        },
      ],
    };
  }
}
