"use client";

import { useQueryClient } from "@tanstack/react-query";

// Timeout constants for invalidation
export const INVALIDATION_TIMEOUT_MS = 3000;
export const ENS_INVALIDATION_TIMEOUT_MS = 1000;

export function useInvalidate() {
  const queryClient = useQueryClient();

  return (queryKeys: unknown[][]) => {
    // Timeout to let indexer catch up and process events
    // Increased to 3 seconds to account for indexer processing time
    setTimeout(
      () =>
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      INVALIDATION_TIMEOUT_MS,
    );
  };
}

/**
 * Invalidate all ENS-related queries (both custom and wagmi's)
 */
export function useInvalidateENS() {
  const queryClient = useQueryClient();

  return () => {
    setTimeout(() => {
      // Invalidate our custom ENS queries
      queryClient.invalidateQueries({ queryKey: ["ens"] });
      // Invalidate wagmi's ENS queries (ensName, ensAddress, ensAvatar, etc.)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === "string" &&
            (key.startsWith("ens") ||
              key === "ensName" ||
              key === "ensAddress" ||
              key === "ensAvatar")
          );
        },
      });
    }, ENS_INVALIDATION_TIMEOUT_MS);
  };
}
