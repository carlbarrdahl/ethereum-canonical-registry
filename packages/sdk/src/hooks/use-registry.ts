"use client";

import { useCanonicalRegistrySDK } from "../components/provider";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address } from "viem";
import { useInvalidate } from "./utils";

type QueryOptions = {
  enabled?: boolean;
  refetchInterval?: number;
};

export function useOwnerOf(
  id: `0x${string}` | undefined,
  opts?: QueryOptions,
): UseQueryResult<Address | null> {
  const { sdk } = useCanonicalRegistrySDK();
  return useQuery({
    queryKey: ["registry", "ownerOf", id],
    queryFn: async () => {
      if (!id) return null;
      return sdk!.registry.ownerOf(id);
    },
    enabled: Boolean(sdk) && Boolean(id) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function usePredictAddress(
  id: `0x${string}` | undefined,
  opts?: QueryOptions,
): UseQueryResult<Address | null> {
  const { sdk } = useCanonicalRegistrySDK();
  return useQuery({
    queryKey: ["registry", "predictAddress", id],
    queryFn: async () => {
      if (!id) return null;
      return sdk!.registry.predictAddress(id);
    },
    enabled: Boolean(sdk) && Boolean(id) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useToId(
  namespace: string | undefined,
  canonicalString: string | undefined,
  opts?: QueryOptions,
): UseQueryResult<`0x${string}` | null> {
  const { sdk } = useCanonicalRegistrySDK();
  return useQuery({
    queryKey: ["registry", "toId", namespace, canonicalString],
    queryFn: async () => {
      if (!namespace || !canonicalString) return null;
      return sdk!.registry.toId(namespace, canonicalString);
    },
    enabled:
      Boolean(sdk) &&
      Boolean(namespace) &&
      Boolean(canonicalString) &&
      (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useClaim(
  opts?: UseMutationOptions<
    { hash: `0x${string}` },
    Error,
    { input: string; proof: `0x${string}` }
  >,
) {
  const { sdk } = useCanonicalRegistrySDK();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      input,
      proof,
    }: {
      input: string;
      proof: `0x${string}`;
    }) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.registry.claim(input, proof);
    },
    onSuccess: (data, variables, ...args) => {
      toast.success("Identifier claimed successfully");
      invalidate([
        ["registry", "ownerOf"],
        ["identifiers"],
        ["identifier"],
      ]);
      opts?.onSuccess?.(data, variables, ...args);
    },
    onError: (error, ...args) => {
      toast.error(error.message || "Failed to claim identifier");
      opts?.onError?.(error, ...args);
    },
    ...opts,
  });
}

export function useRevoke(
  opts?: UseMutationOptions<
    { hash: `0x${string}` },
    Error,
    { input: string }
  >,
) {
  const { sdk } = useCanonicalRegistrySDK();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({ input }: { input: string }) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.registry.revoke(input);
    },
    onSuccess: (data, variables, ...args) => {
      toast.success("Identifier revoked");
      invalidate([["registry", "ownerOf"], ["identifiers"], ["identifier"]]);
      opts?.onSuccess?.(data, variables, ...args);
    },
    onError: (error, ...args) => {
      toast.error(error.message || "Failed to revoke identifier");
      opts?.onError?.(error, ...args);
    },
    ...opts,
  });
}

export function useLinkIds(
  opts?: UseMutationOptions<
    { hash: `0x${string}` },
    Error,
    { primaryId: `0x${string}`; aliasIds: `0x${string}`[] }
  >,
) {
  const { sdk } = useCanonicalRegistrySDK();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      primaryId,
      aliasIds,
    }: {
      primaryId: `0x${string}`;
      aliasIds: `0x${string}`[];
    }) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.registry.linkIds(primaryId, aliasIds);
    },
    onSuccess: (data, variables, ...args) => {
      toast.success("Identifiers linked");
      invalidate([["identifiers"], ["identifier"]]);
      opts?.onSuccess?.(data, variables, ...args);
    },
    onError: (error, ...args) => {
      toast.error(error.message || "Failed to link identifiers");
      opts?.onError?.(error, ...args);
    },
    ...opts,
  });
}

export function useUnlinkIds(
  opts?: UseMutationOptions<
    { hash: `0x${string}` },
    Error,
    { primaryId: `0x${string}`; aliasIds: `0x${string}`[] }
  >,
) {
  const { sdk } = useCanonicalRegistrySDK();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      primaryId,
      aliasIds,
    }: {
      primaryId: `0x${string}`;
      aliasIds: `0x${string}`[];
    }) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.registry.unlinkIds(primaryId, aliasIds);
    },
    onSuccess: (data, variables, ...args) => {
      toast.success("Identifiers unlinked");
      invalidate([["identifiers"], ["identifier"]]);
      opts?.onSuccess?.(data, variables, ...args);
    },
    onError: (error, ...args) => {
      toast.error(error.message || "Failed to unlink identifiers");
      opts?.onError?.(error, ...args);
    },
    ...opts,
  });
}

export function useDeployAccount(
  opts?: UseMutationOptions<
    { hash: `0x${string}` },
    Error,
    { id: `0x${string}` }
  >,
) {
  const { sdk } = useCanonicalRegistrySDK();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({ id }: { id: `0x${string}` }) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.registry.deployAccount(id);
    },
    onSuccess: (data, variables, ...args) => {
      toast.success("Account deployed");
      invalidate([["registry", "predictAddress", variables.id]]);
      opts?.onSuccess?.(data, variables, ...args);
    },
    onError: (error, ...args) => {
      toast.error(error.message || "Failed to deploy account");
      opts?.onError?.(error, ...args);
    },
    ...opts,
  });
}
