"use client";

import { useEntityRegistrySDK } from "../components/provider";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address } from "viem";
import { useInvalidate } from "./utils";

export function useExecute(
  opts?: UseMutationOptions<
    { hash: `0x${string}` },
    Error,
    { accountAddress: Address; target: Address; data: `0x${string}`; value?: bigint }
  >,
) {
  const { sdk } = useEntityRegistrySDK();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      accountAddress,
      target,
      data,
      value,
    }: {
      accountAddress: Address;
      target: Address;
      data: `0x${string}`;
      value?: bigint;
    }) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.account.execute(accountAddress, target, data, value);
    },
    onSuccess: (data, variables, ...args) => {
      toast.success("Transaction executed");
      invalidate([["identifiers"], ["identifier"]]);
      opts?.onSuccess?.(data, variables, ...args);
    },
    onError: (error, ...args) => {
      toast.error(error.message || "Failed to execute transaction");
      opts?.onError?.(error, ...args);
    },
    ...opts,
  });
}
