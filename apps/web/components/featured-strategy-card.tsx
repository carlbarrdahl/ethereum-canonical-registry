"use client";

import Link from "next/link";
import { type Address } from "viem";
import { LayersIcon, UsersIcon, GitForkIcon } from "lucide-react";
import { ENS_DOMAIN } from "@ethereum-entity-registry/sdk";
import { Badge } from "@ethereum-entity-registry/ui/components/badge";
import { EnsName } from "@/components/ens";
import { USDAmount } from "@/components/amount";
import { getColorForAddress } from "@/lib/color-utils";
import { Markdown } from "@/components/markdown";
import { FundDialog } from "@/app/strategies/[id]/_components/fund-dialog";
import type { Strategy } from "@ethereum-entity-registry/sdk";

interface FeaturedStrategyCardProps {
  strategy: Strategy;
  allocatedUSD: bigint;
}

export function FeaturedStrategyCard({
  strategy,
  allocatedUSD,
}: FeaturedStrategyCardProps) {
  const allocations = strategy.allocations ?? [];
  const totalWeight = allocations.reduce(
    (sum, a) => sum + BigInt(a.weight),
    0n,
  );

  return (
    <section className="max-w-3xl mx-auto">
      <div className="rounded-lg border overflow-hidden hover:border-muted-foreground/25 transition-colors">
        <Link href={`/strategies/${strategy.id}`} className="block group">
          {/* Allocation Bar - Larger with more prominence */}
          {allocations.length > 0 && totalWeight > 0n ? (
            <div className="flex h-3 w-full overflow-hidden bg-muted">
              {allocations.map((alloc) => {
                const pct =
                  Number((BigInt(alloc.weight) * 10000n) / totalWeight) / 100;
                return (
                  <div
                    key={alloc.recipient}
                    className={getColorForAddress(alloc.recipient)}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-3 w-full bg-muted" />
          )}

          <div className="p-6 space-y-6">
            {/* Title & Metadata */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                    {strategy.metadata?.title}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    by <EnsName address={strategy.owner} />
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {strategy.ensLabel
                    ? `${strategy.ensLabel}.${ENS_DOMAIN}`
                    : ""}
                </Badge>
              </div>

              {/* Description */}
              {strategy.metadata?.description && (
                <Markdown className="text-sm text-muted-foreground line-clamp-2">
                  {strategy.metadata.description}
                </Markdown>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <LayersIcon className="w-4 h-4" />
                {allocations.length}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <UsersIcon className="w-4 h-4" />
                {strategy.uniqueDonors}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <GitForkIcon className="w-4 h-4" />
                {strategy.timesForked}
              </span>
            </div>

            {/* Allocations Preview */}
            {allocations.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Allocations
                </p>
                <div className="space-y-2">
                  {allocations.slice(0, 5).map((alloc) => {
                    const pct =
                      Number((BigInt(alloc.weight) * 10000n) / totalWeight) /
                      100;
                    return (
                      <div
                        key={alloc.recipient}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${getColorForAddress(alloc.recipient)}`}
                          />
                          <span className="truncate">
                            {alloc.label || (
                              <EnsName address={alloc.recipient} />
                            )}
                          </span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                  {allocations.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{allocations.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Fund Button - Placed near financial data */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between gap-4 pt-5 border-t">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                Total Allocated
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                <USDAmount amount={allocatedUSD} compact />
              </p>
            </div>
            <FundDialog strategyAddress={strategy.id as Address} />
          </div>
        </div>
      </div>
    </section>
  );
}
