"use client";

import { useStrategies, useStrategyBalances } from "@workspace/sdk";
import { StrategyCard } from "@/components/strategy-card";
import { StrategyCardSkeleton } from "@/components/strategy-card-skeleton";
import { FeaturedStrategyCard } from "@/components/featured-strategy-card";
import { Button } from "@workspace/ui/components/button";
import { AlertCircleIcon } from "lucide-react";

export default function Page() {
  const { data: strategiesPage, isPending, isError, refetch } = useStrategies({
    orderBy: "timesForked",
    orderDirection: "desc",
    limit: 20,
  });

  const { data: allBalances } = useStrategyBalances({
    limit: 1000,
  });

  const strategies = strategiesPage?.items ?? [];

  // Split strategies: main (first) and others
  const mainStrategy = strategies[0];
  const otherStrategies = strategies.slice(1);

  // Helper to get allocated USD for a strategy
  const getAllocatedUSD = (strategyId: string) =>
    allBalances?.items
      .filter((b) => b.strategyId === strategyId)
      .reduce((sum, b) => sum + BigInt(b.totalReceivedUSD ?? 0), 0n) ?? 0n;

  return (
    <div className="px-6 py-12 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-8 md:pt-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Fund Ethereum&apos;s Infra
        </h1>
        <h2 className="text-xl md:text-2xl text-muted-foreground">
          Ensure 100% uptime for 100 years
        </h2>
      </div>

      {isError ? (
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertCircleIcon className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Failed to load strategies</h2>
            <p className="text-sm text-muted-foreground">
              There was an error loading the strategies. Please try again.
            </p>
          </div>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      ) : isPending ? (
        <>
          {/* Main Strategy Skeleton */}
          <section className="max-w-3xl mx-auto">
            <div className="rounded-lg border p-6 space-y-4 animate-pulse">
              <div className="h-3 w-full rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-8 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-3 w-1/3 bg-muted rounded" />
              </div>
              <div className="h-16 w-full bg-muted rounded" />
              <div className="flex gap-4">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            </div>
          </section>

          {/* Other Strategies Skeleton */}
          <section className="max-w-5xl mx-auto space-y-6">
            <div className="h-3 w-32 mx-auto bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <StrategyCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Main Strategy - Expanded Layout */}
          {mainStrategy && (
            <FeaturedStrategyCard
              strategy={mainStrategy}
              allocatedUSD={getAllocatedUSD(mainStrategy.id)}
            />
          )}

          {/* Other Strategies */}
          {otherStrategies.length > 0 && (
            <section className="max-w-5xl mx-auto space-y-6">
              <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground text-center">
                Forked strategies
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherStrategies.map((s) => (
                  <StrategyCard
                    key={s.id}
                    strategy={s}
                    allocatedUSD={getAllocatedUSD(s.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
