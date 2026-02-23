"use client";

import { useCanonicalRegistrySDK } from "../components/provider";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address } from "viem";
import { useInvalidate } from "./utils";

export function useWithdrawTo(
  opts?: UseMutationOptions<
    { hash: `0x${string}` },
    Error,
    { escrowAddress: Address; token: Address }
  >,
) {
  const { sdk } = useCanonicalRegistrySDK();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      escrowAddress,
      token,
    }: {
      escrowAddress: Address;
      token: Address;
    }) => {
      if (!sdk) throw new Error("SDK not initialized");
      return sdk.escrow.withdrawTo(escrowAddress, token);
    },
    onSuccess: (data, variables, ...args) => {
      toast.success("Withdrawal successful");
      invalidate([
        ["escrowWithdrawals"],
        ["warehouseBalance"],
        ["warehouseBalances"],
      ]);
      opts?.onSuccess?.(data, variables, ...args);
    },
    onError: (error, ...args) => {
      toast.error(error.message || "Failed to withdraw from escrow");
      opts?.onError?.(error, ...args);
    },
    ...opts,
  });
}
