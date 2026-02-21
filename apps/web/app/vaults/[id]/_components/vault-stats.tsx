"use client";

import { type Address } from "viem";
import { useReadContract } from "wagmi";
import {
  CoinsIcon,
  SparklesIcon,
  TrendingUpIcon,
  HashIcon,
  ClockIcon,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { TokenAmount } from "@/components/token-amount";
import { Amount } from "@/components/amount";
import { useHarvestYield } from "@workspace/sdk";
import { DepositDialog } from "./deposit-dialog";
import { timeAgo } from "@/lib/format";

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

interface VaultStatsProps {
  vault: {
    asset: Address;
    principal: string;
    totalHarvested: string;
    totalHarvestedUSD: string;
    harvestCount: number;
    lastHarvestAt: bigint | null;
  };
  vaultAddress: Address;
}

export function VaultStats({ vault, vaultAddress }: VaultStatsProps) {
  const { mutate: harvest, isPending: isHarvesting } = useHarvestYield();

  // Query available yield from contract with aggressive polling
  const { data: surplus, isLoading: isSurplusLoading } = useReadContract({
    address: vaultAddress,
    abi: YIELD_REDIRECTOR_ABI,
    functionName: "surplus",
    query: {
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  });

  const surplusAmount = surplus ?? 0n;

  const lastHarvestDate = vault.lastHarvestAt
    ? new Date(Number(vault.lastHarvestAt) * 1000)
    : null;

  return (
    <div className="space-y-8">
      {/* Financial stats */}
      <div className="space-y-6">
        {/* Principal */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CoinsIcon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Total Principal
            </span>
          </div>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            <TokenAmount
              amount={BigInt(vault.principal)}
              token={vault.asset}
              showSymbol
            />
          </p>
        </div>

        {/* Available Yield */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Available Yield
            </span>
          </div>
          {isSurplusLoading ? (
            <Skeleton className="h-10 w-36" />
          ) : (
            <p
              className={`text-4xl font-bold tracking-tight tabular-nums ${surplusAmount > 0n ? "text-green-600 dark:text-green-400" : ""}`}
            >
              <TokenAmount
                amount={surplusAmount}
                token={vault.asset}
                showSymbol
              />
            </p>
          )}
        </div>

        {/* Total Harvested */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUpIcon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Total Harvested
            </span>
          </div>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            <TokenAmount
              amount={BigInt(vault.totalHarvested)}
              token={vault.asset}
              showSymbol
            />
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              $
              <Amount
                amount={BigInt(vault.totalHarvestedUSD)}
                decimals={18}
              />{" "}
              USD
            </span>
            <span className="inline-flex items-center gap-1">
              <HashIcon className="w-3 h-3" />
              {vault.harvestCount} harvest
              {vault.harvestCount !== 1 ? "s" : ""}
            </span>
            {lastHarvestDate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Last {timeAgo(lastHarvestDate)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {lastHarvestDate.toLocaleString()}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Primary actions */}
      <div className="flex items-center gap-2">
        <DepositDialog vaultAddress={vaultAddress} asset={vault.asset} />
        <Button
          variant="outline"
          size="sm"
          icon={TrendingUpIcon}
          onClick={() => harvest(vaultAddress)}
          disabled={isHarvesting}
          isLoading={isHarvesting}
        >
          Harvest
        </Button>
      </div>
    </div>
  );
}

