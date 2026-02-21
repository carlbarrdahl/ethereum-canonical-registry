"use client";

import { type Address } from "viem";
import { useReadContract } from "wagmi";
import { TokenAmount } from "@/components/token-amount";
import { Skeleton } from "@workspace/ui/components/skeleton";

// YieldRedirector4626 ABI - just the surplus function
const YIELD_REDIRECTOR_ABI = [
  {
    name: "surplus",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

interface AvailableYieldProps {
  vaultAddress: Address;
  asset: Address;
}

export function AvailableYield({ vaultAddress, asset }: AvailableYieldProps) {
  const { data: surplus, isLoading } = useReadContract({
    address: vaultAddress,
    abi: YIELD_REDIRECTOR_ABI,
    functionName: "surplus",
    query: {
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  });

  if (isLoading) {
    return <Skeleton className="h-5 w-20" />;
  }

  const surplusAmount = surplus ?? 0n;
  const hasYield = surplusAmount > 0n;

  return (
    <span className={hasYield ? "text-green-600 dark:text-green-400 font-medium" : ""}>
      <TokenAmount amount={surplusAmount} token={asset} showSymbol />
    </span>
  );
}
