"use client";

import { useCanonicalRegistrySDK } from "../components/provider";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address } from "viem";
import type {
  WarehouseBalance,
  Page,
  QueryVariables,
  WarehouseBalanceFilter,
} from "../lib/indexer";

type QueryOptions = {
  enabled?: boolean;
  refetchInterval?: number;
};

export function useWarehouseBalances(
  variables: QueryVariables<WarehouseBalanceFilter> = {},
  opts?: QueryOptions,
): UseQueryResult<Page<WarehouseBalance> | null> {
  const { sdk } = useCanonicalRegistrySDK();
  return useQuery({
    queryKey: ["warehouseBalances", variables],
    queryFn: () => sdk?.indexer?.warehouseBalance.query(variables) ?? null,
    enabled: Boolean(sdk?.indexer) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useWarehouseBalance(
  user: Address | undefined,
  token: Address | undefined,
  opts?: QueryOptions,
): UseQueryResult<WarehouseBalance | null> {
  const { sdk } = useCanonicalRegistrySDK();
  return useQuery({
    queryKey: ["warehouseBalance", user, token],
    queryFn: async () => {
      if (!user || !token) return null;
      const result = await sdk?.indexer?.warehouseBalance.query({
        where: { user: user.toLowerCase(), token: token.toLowerCase() },
        limit: 1,
      });
      return result?.items[0] ?? null;
    },
    enabled:
      Boolean(sdk?.indexer) &&
      Boolean(user) &&
      Boolean(token) &&
      (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useWithdrawFromWarehouse(
  opts?: UseMutationOptions<
    { hash: `0x${string}` },
    Error,
    { owner: Address; token: Address }
  >,
) {
  const { sdk } = useCanonicalRegistrySDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      token,
    }: {
      owner: Address;
      token: Address;
    }) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.warehouse.withdraw(owner, token);
    },
    onSuccess: (data, variables, ...args) => {
      toast.success("Withdrawal successful");
      // Invalidate warehouse balance queries
      queryClient.invalidateQueries({
        queryKey: ["warehouseBalance", variables.owner, variables.token],
      });
      queryClient.invalidateQueries({
        queryKey: ["warehouseBalances"],
      });
      opts?.onSuccess?.(data, variables, ...args);
    },
    onError: (error, ...args) => {
      toast.error(error.message || "Failed to withdraw tokens");
      opts?.onError?.(error, ...args);
    },
    ...opts,
  });
}
