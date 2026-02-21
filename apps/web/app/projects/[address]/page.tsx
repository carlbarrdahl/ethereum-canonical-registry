"use client";

import { use } from "react";
import Link from "next/link";
import { type Address } from "viem";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  LayersIcon,
  DollarSignIcon,
  WalletIcon,
  SendIcon,
} from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import {
  useStrategies,
  usePayouts,
  useWarehouseBalances,
} from "@workspace/sdk";
import { Button } from "@workspace/ui/components/button";

import { EnsName } from "@/components/ens";
import { TokenAmount } from "@/components/token-amount";
import { USDAmount } from "@/components/amount";
import { getColorForAddress } from "@/lib/color-utils";
import { timeAgo } from "@/lib/format";
import { ErrorBanner } from "@/components/error-banner";

function ProjectPageSkeleton() {
  return (
    <div className="px-6 py-8 space-y-10">
      <Skeleton className="h-4 w-28" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const projectAddress = address as Address;

  const { data: strategiesPage, isPending: strategiesLoading, isError: strategiesError, refetch: refetchStrategies } = useStrategies(
    { limit: 1000 },
    { refetchInterval: 5000 },
  );

  const { data: payoutsPage, isPending: payoutsLoading, isError: payoutsError, refetch: refetchPayouts } = usePayouts(
    {
      where: { recipient: projectAddress.toLowerCase() },
      orderBy: "timestamp",
      orderDirection: "desc",
      limit: 50,
    },
    { refetchInterval: 5000 },
  );

  const { data: warehousePage, isError: warehouseError, refetch: refetchWarehouse } = useWarehouseBalances(
    {
      where: { user: projectAddress.toLowerCase() },
    },
    { refetchInterval: 5000 },
  );

  // Find strategies that include this recipient
  const strategies = strategiesPage?.items ?? [];
  const recipientStrategies = strategies
    .map((s) => {
      const alloc = s.allocations.find(
        (a) => a.recipient.toLowerCase() === projectAddress.toLowerCase(),
      );
      if (!alloc) return null;
      const totalWeight = s.allocations.reduce(
        (sum, a) => sum + BigInt(a.weight),
        0n,
      );
      return { strategy: s, allocation: alloc, totalWeight };
    })
    .filter(Boolean) as {
    strategy: (typeof strategies)[number];
    allocation: { recipient: Address; weight: string; label?: string };
    totalWeight: bigint;
  }[];

  // Pick the first non-null label
  const label = recipientStrategies
    .map((rs) => rs.allocation.label)
    .find((l) => l != null);

  const payouts = payoutsPage?.items ?? [];
  const warehouseBalances = warehousePage?.items ?? [];

  // Totals
  const totalEarnedUSD = payouts.reduce(
    (sum, p) => sum + BigInt(p.amountUSD),
    0n,
  );
  const totalClaimableUSD = warehouseBalances.reduce(
    (sum, b) => sum + BigInt(b.totalEarnedUSD) - BigInt(b.totalClaimed),
    0n,
  );

  if (strategiesLoading) {
    return <ProjectPageSkeleton />;
  }

  const hasError = strategiesError || payoutsError || warehouseError;

  return (
    <div className="px-6 py-8 space-y-12">
      {/* Back Link */}
      <Link
        href="/projects"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Projects
      </Link>

      {hasError && (
        <ErrorBanner
          onRetry={() => {
            if (strategiesError) refetchStrategies();
            if (payoutsError) refetchPayouts();
            if (warehouseError) refetchWarehouse();
          }}
        />
      )}

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 pb-10 border-b">
        {/* Identity */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full ${getColorForAddress(projectAddress)} shrink-0 flex items-center justify-center`}
            >
              <span className="text-lg font-mono text-white font-semibold"></span>
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {label || <EnsName address={projectAddress} length={20} />}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono text-xs">
              {projectAddress}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <LayersIcon className="w-3 h-3" />
              {recipientStrategies.length} strateg
              {recipientStrategies.length !== 1 ? "ies" : "y"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSignIcon className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider font-medium">
                Total Earned
              </span>
            </div>
            <p className="text-4xl font-bold tracking-tight tabular-nums">
              <USDAmount amount={totalEarnedUSD} />
            </p>
          </div>

          {totalClaimableUSD > 0n && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <WalletIcon className="w-3.5 h-3.5" />
                <span className="text-xs uppercase tracking-wider font-medium">
                  Claimable
                </span>
              </div>
              <p className="text-4xl font-bold tracking-tight tabular-nums">
                <USDAmount amount={totalClaimableUSD} />
              </p>
              {warehouseBalances.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {warehouseBalances.map((b) => (
                    <span key={b.token}>
                      <TokenAmount amount={b.balance} token={b.token} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Strategies */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Strategies</h2>
          <Badge variant="secondary" className="text-xs">
            {recipientStrategies.length}
          </Badge>
        </div>

        {recipientStrategies.length === 0 ? (
          <div className="rounded-lg border py-12 text-center space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
              <LayersIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Not in any strategies
            </p>
            <p className="text-xs text-muted-foreground">
              This address is not currently allocated in any strategy.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {recipientStrategies.map(
              ({ strategy, allocation, totalWeight }) => {
                const percent =
                  totalWeight > 0n
                    ? Number(
                        (BigInt(allocation.weight) * 10000n) / totalWeight,
                      ) / 100
                    : 0;

                return (
                  <Link
                    key={strategy.id}
                    href={`/strategies/${strategy.id}`}
                    className="px-4 py-3 block hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {strategy.metadata?.title || "Untitled Strategy"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {allocation.label && (
                            <span>
                              Label:{" "}
                              <span className="text-foreground">
                                {allocation.label}
                              </span>
                              {" · "}
                            </span>
                          )}
                          by <EnsName address={strategy.owner} />
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {percent.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            weight
                          </p>
                        </div>
                        <ArrowRightIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}
      </section>

      {/* Payout History */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Payout History
          </h2>
          {payouts.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {payouts.length} payout{payouts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {payoutsLoading ? (
          <div className="rounded-lg border divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="rounded-lg border py-12 text-center space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
              <SendIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No payouts yet
            </p>
            <p className="text-xs text-muted-foreground">
              Payouts will appear here when distributions are made.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right w-[100px]">Tx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => {
                  const date = new Date(Number(payout.timestamp) * 1000);
                  const strategy = strategies.find(
                    (s) =>
                      s.id.toLowerCase() === payout.strategyId.toLowerCase(),
                  );

                  return (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-muted-foreground tabular-nums">
                              {timeAgo(date)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {date.toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/strategies/${payout.strategyId}`}
                          className="text-sm hover:underline"
                        >
                          {strategy?.metadata?.title ||
                            `${payout.strategyId.slice(0, 6)}...${payout.strategyId.slice(-4)}`}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <TokenAmount
                          amount={payout.amount}
                          token={payout.token}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <USDAmount amount={payout.amountUSD} />
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`https://etherscan.io/tx/${payout.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
                        >
                          {payout.txHash.slice(0, 6)}...
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

