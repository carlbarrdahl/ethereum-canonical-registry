"use client";

import Link from "next/link";
import { type Address } from "viem";
import { LayersIcon } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import { TokenAmount } from "@/components/token-amount";
import { USDAmount } from "@/components/amount";
import { getColorForAddress } from "@/lib/color-utils";

interface Allocation {
  recipient: Address;
  weight: string;
  label?: string | null;
}

interface AllocationListProps {
  allocations: Allocation[];
  totalWeight: bigint;
  totalBalanceUSD: bigint;
  balances:
    | {
        token: Address;
        totalReceived: string;
      }[]
    | undefined;
  strategyAddresses: Set<string>;
}

export function AllocationList({
  allocations,
  totalWeight,
  totalBalanceUSD,
  balances,
  strategyAddresses,
}: AllocationListProps) {
  const getColor = (address: string) => getColorForAddress(address);
  const getPercent = (alloc: Allocation) =>
    calculatePercent(BigInt(alloc.weight), totalWeight);

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Allocations</h2>
        <Badge variant="secondary" className="text-xs">
          {allocations.length} recipient{allocations.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Distribution bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {allocations.map((alloc, i) => {
          const pct = getPercent(alloc);
          const color = getColor(alloc.recipient);
          return (
            <Tooltip key={alloc.recipient}>
              <TooltipTrigger asChild>
                <div
                  className={`${color} transition-all first:rounded-l-full last:rounded-r-full hover:opacity-80`}
                  style={{ width: `${pct}%` }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <span className="font-medium">
                  {alloc.label || `Recipient ${i + 1}`}
                </span>{" "}
                — {pct.toFixed(1)}%
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Allocation rows */}
      <div className="rounded-lg border divide-y">
        {allocations.map((alloc, i) => {
          const weight = BigInt(alloc.weight);
          const percent = getPercent(alloc);
          const allocUSD = calculateAllocation(
            totalBalanceUSD,
            weight,
            totalWeight,
          );
          const color = getColor(alloc.recipient);
          const isStrategy = strategyAddresses.has(
            alloc.recipient.toLowerCase(),
          );

          return (
            <Link
              key={alloc.recipient}
              href={
                isStrategy
                  ? `/strategies/${alloc.recipient}`
                  : `/projects/${alloc.recipient}`
              }
              className={`px-4 py-3 block hover:bg-muted/50 transition-colors ${
                isStrategy ? "border-l-2 border-l-primary/20" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Color dot */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />

                {/* Recipient info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {alloc.label || `Recipient ${i + 1}`}
                    </p>
                    {isStrategy && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 gap-1"
                      >
                        <LayersIcon className="w-2.5 h-2.5" />
                        Strategy
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {alloc.recipient.slice(0, 6)}...
                    {alloc.recipient.slice(-4)}
                  </p>
                </div>

                {/* Desktop token amounts */}
                {balances && balances.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    {balances.map((b) => {
                      const allocAmount = calculateAllocation(
                        BigInt(b.totalReceived),
                        weight,
                        totalWeight,
                      );
                      return (
                        <span key={b.token}>
                          <TokenAmount amount={allocAmount} token={b.token} />
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Percentage + USD */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {percent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <USDAmount amount={allocUSD} />
                  </p>
                </div>
              </div>

              {/* Mobile token amounts */}
              {balances && balances.length > 0 && (
                <div className="flex sm:hidden items-center gap-2 mt-1.5 ml-[22px] text-xs text-muted-foreground">
                  {balances.map((b) => {
                    const allocAmount = calculateAllocation(
                      BigInt(b.totalReceived),
                      weight,
                      totalWeight,
                    );
                    return (
                      <span key={b.token}>
                        <TokenAmount amount={allocAmount} token={b.token} />
                      </span>
                    );
                  })}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function calculatePercent(weight: bigint, totalWeight: bigint): number {
  return totalWeight > 0n ? Number((weight * 10000n) / totalWeight) / 100 : 0;
}

function calculateAllocation(
  total: bigint,
  weight: bigint,
  totalWeight: bigint,
): bigint {
  return totalWeight > 0n ? (total * weight) / totalWeight : 0n;
}
