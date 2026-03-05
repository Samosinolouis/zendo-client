// ============================================================
// Zendo — React hooks for GraphQL data fetching
// Simple hook wrapper around graphqlClient with loading/error state
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { graphqlClient, GraphQLError } from "@/lib/graphql-client";

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: GraphQLError | null;
  refetch: () => void;
}

/**
 * Hook that fetches a GraphQL query and manages loading/error/data state.
 * Refetches automatically when `variables` identity changes.
 */
export function useQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { skip?: boolean }
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<GraphQLError | null>(null);

  // Serialize variables for dependency — stable identity
  const varsKey = variables ? JSON.stringify(variables) : "";

  const fetchData = useCallback(async () => {
    if (options?.skip) return;
    setLoading(true);
    setError(null);
    try {
      const res = await graphqlClient<T>(query, variables);
      if (res.errors?.length) {
        setError(res.errors[0]);
        setData(null);
      } else {
        setData(res.data ?? null);
      }
    } catch {
      setError({ message: "Network error" });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, varsKey, options?.skip]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

interface UseMutationResult<T> {
  mutate: (variables: Record<string, unknown>) => Promise<T | null>;
  data: T | null;
  loading: boolean;
  error: GraphQLError | null;
}

/**
 * Hook that returns a function to execute a GraphQL mutation.
 *
 * When `throwOnError: true` is set, GraphQL/network errors are thrown
 * as exceptions so the caller's try-catch receives the real message.
 */
export function useMutation<T>(
  mutation: string,
  options?: {
    onCompleted?: (data: T | null) => void;
    onError?: (err: GraphQLError) => void;
    throwOnError?: boolean;
  }
): UseMutationResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GraphQLError | null>(null);

  const mutate = useCallback(
    async (variables: Record<string, unknown>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await graphqlClient<T>(mutation, variables);
        if (res.errors?.length) {
          setError(res.errors[0]);
          options?.onError?.(res.errors[0]);
          setData(null);
          if (options?.throwOnError) throw new Error(res.errors[0].message);
          return null;
        }
        setData(res.data ?? null);
        options?.onCompleted?.(res.data ?? null);
        return res.data ?? null;
      } catch (e) {
        if (e instanceof Error && options?.throwOnError) throw e;
        const err: GraphQLError = { message: e instanceof Error ? e.message : "Network error" };
        setError(err);
        options?.onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutation, options]
  );

  return { mutate, data, loading, error };
}

// ── Helper: extract edges from a connection result ────────────

export function extractNodes<T>(
  connection: { edges: Array<{ node: T }> } | null | undefined
): T[] {
  return connection?.edges?.map((e) => e.node) ?? [];
}
