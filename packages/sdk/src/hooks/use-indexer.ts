"use client";

import { useCuratorSDK } from "../components/provider";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  Identifier,
  IdentifierAlias,
  Withdrawal,
  WarehouseBalance,
  Page,
  QueryVariables,
  IdentifierFilter,
  AliasFilter,
  WithdrawalFilter,
  WarehouseBalanceFilter,
  RegistryStats,
} from "../lib/indexer";

type QueryOptions = {
  enabled?: boolean;
  refetchInterval?: number;
};

export function useIdentifiers(
  variables: QueryVariables<IdentifierFilter> = {},
  opts?: QueryOptions,
): UseQueryResult<Page<Identifier> | null> {
  const { sdk } = useCuratorSDK();
  return useQuery({
    queryKey: ["identifiers", variables],
    queryFn: () => sdk?.indexer?.identifier.query(variables) ?? null,
    enabled: Boolean(sdk?.indexer) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useIdentifier(
  id: `0x${string}` | undefined,
  opts?: QueryOptions,
): UseQueryResult<Identifier | null> {
  const { sdk } = useCuratorSDK();
  return useQuery({
    queryKey: ["identifier", id],
    queryFn: () => (id ? (sdk?.indexer?.identifier.get(id) ?? null) : null),
    enabled: Boolean(sdk?.indexer) && Boolean(id) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useAliases(
  variables: QueryVariables<AliasFilter> = {},
  opts?: QueryOptions,
): UseQueryResult<Page<IdentifierAlias> | null> {
  const { sdk } = useCuratorSDK();
  return useQuery({
    queryKey: ["aliases", variables],
    queryFn: () => sdk?.indexer?.alias.query(variables) ?? null,
    enabled: Boolean(sdk?.indexer) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useEscrowWithdrawals(
  variables: QueryVariables<WithdrawalFilter> = {},
  opts?: QueryOptions,
): UseQueryResult<Page<Withdrawal> | null> {
  const { sdk } = useCuratorSDK();
  return useQuery({
    queryKey: ["escrowWithdrawals", variables],
    queryFn: () => sdk?.indexer?.withdrawal.query(variables) ?? null,
    enabled: Boolean(sdk?.indexer) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useRegistryStats(
  opts?: QueryOptions,
): UseQueryResult<RegistryStats | null> {
  const { sdk } = useCuratorSDK();
  return useQuery({
    queryKey: ["registryStats"],
    queryFn: () => sdk?.indexer?.stats() ?? null,
    enabled: Boolean(sdk?.indexer) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}
