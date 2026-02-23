"use client";

import { useQueryClient } from "@tanstack/react-query";

export const INVALIDATION_TIMEOUT_MS = 3000;

export function useInvalidate() {
  const queryClient = useQueryClient();

  return (queryKeys: unknown[][]) => {
    setTimeout(
      () =>
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      INVALIDATION_TIMEOUT_MS,
    );
  };
}
