"use client";

import Link from "next/link";
import { type Address } from "viem";
import { GitForkIcon, ArrowRightIcon } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useForks, useStrategies } from "@workspace/sdk";
import { EnsName } from "@/components/ens";
import { timeAgo } from "@/lib/format";

interface ForksListProps {
  strategyAddress: Address;
}

export function ForksList({ strategyAddress }: ForksListProps) {
  const { data: forks, isPending: forksLoading } = useForks({
    where: { sourceStrategyId: strategyAddress.toLowerCase() },
    orderBy: "createdAt",
    orderDirection: "desc",
  });

  // Extract child strategy IDs
  const childStrategyIds = forks?.items.map((f) => f.childStrategyId) ?? [];

  // Query all forked strategies
  const { data: strategies, isPending: strategiesLoading } = useStrategies(
    {
      where: { id_in: childStrategyIds.map((id) => id.toLowerCase()) },
    },
    { enabled: childStrategyIds.length > 0 },
  );

  const isLoading = forksLoading || strategiesLoading;
  if (isLoading && childStrategyIds.length) {
    return (
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Forks</h2>
        </div>
        <div className="rounded-lg border divide-y">
          {[1, 2].map((i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <div className="flex-1 min-w-0 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (!forks?.items.length) return null;
  if (!forks?.items.length) {
    return (
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Forks</h2>
          <Badge variant="secondary" className="text-xs">
            0
          </Badge>
        </div>
        <div className="rounded-lg border py-12 text-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-2">
            <GitForkIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No forks yet
          </p>
          <p className="text-xs text-muted-foreground">
            When someone forks this strategy, they'll appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Forks</h2>
        <Badge variant="secondary" className="text-xs">
          {forks.items.length}
        </Badge>
      </div>

      <div className="rounded-lg border divide-y">
        {forks.items.map((fork) => {
          const strategy = strategies?.items.find(
            (s) => s.id.toLowerCase() === fork.childStrategyId.toLowerCase(),
          );
          const createdAt = new Date(Number(fork.createdAt) * 1000);

          return (
            <Link
              key={fork.id}
              href={`/strategies/${fork.childStrategyId}`}
              className="px-4 py-3 block hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Fork icon */}
                <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-purple-500" />

                {/* Strategy info */}
                <div className="flex-1 min-w-0">
                  {strategy ? (
                    <>
                      <p className="font-medium text-sm truncate">
                        {strategy.metadata?.title || "Unnamed Strategy"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span>by</span>
                          <span className="font-mono">
                            <EnsName address={strategy.owner} length={12} />
                          </span>
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-sm font-mono truncate">
                        <EnsName address={fork.childStrategyId} length={16} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Loading strategy info...
                      </p>
                    </>
                  )}
                </div>

                {/* Date + arrow */}
                <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                  <span>{timeAgo(createdAt)}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

