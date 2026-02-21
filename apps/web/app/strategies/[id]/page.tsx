"use client";

import { use } from "react";
import Link from "next/link";
import { type Address } from "viem";
import { ArrowLeftIcon, SendIcon } from "lucide-react";
import { useAccount } from "wagmi";

import { Skeleton } from "@workspace/ui/components/skeleton";

import {
  useStrategyById,
  useStrategyBalances,
  useDistributions,
  useStrategies,
} from "@workspace/sdk";

import { TransactionHistory } from "@/components/transaction-history";
import {
  StrategyHeader,
  StrategyStats,
  AllocationList,
  YieldVaultsList,
  ForksList,
} from "./_components";

function StrategyPageSkeleton() {
  return (
    <div className="px-6 py-8 space-y-10">
      <Skeleton className="h-4 w-28" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyNotFound() {
  return (
    <div className="px-6 py-8 space-y-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Strategies
      </Link>
      <div className="py-20 text-center">
        <p className="text-lg font-medium mb-1">Strategy not found</p>
        <p className="text-muted-foreground text-sm">
          This strategy may have been removed or the address is invalid.
        </p>
      </div>
    </div>
  );
}

export default function StrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const strategyAddress = id as Address;

  const { address } = useAccount();

  const { data: strategy, isPending } = useStrategyById(strategyAddress, {
    refetchInterval: (s) => {
      return !!s.state.data ? -1 : 1000;
    },
  });
  const { data: balances } = useStrategyBalances(
    { where: { strategyId: id } },
    { refetchInterval: 2000 },
  );

  const { data: distributions } = useDistributions(
    {
      where: { strategyId: id },
      orderBy: "timestamp",
      orderDirection: "desc",
      limit: 10,
    },
    { refetchInterval: 2000 },
  );

  // Query for strategies that match allocation recipients
  const allocationRecipients = strategy?.allocations.map((a) =>
    a.recipient.toLowerCase(),
  );
  const { data: recipientStrategies } = useStrategies(
    {
      where: {
        id_in: allocationRecipients,
      },
    },
    { enabled: !!allocationRecipients && allocationRecipients.length > 0 },
  );

  // Create a Set of strategy addresses for quick lookup
  const strategyAddresses = new Set(
    recipientStrategies?.items.map((s) => s.id.toLowerCase()) ?? [],
  );

  // Calculate totals
  const totalWeight = calculateTotalWeight(strategy?.allocations);
  const totalReceivedUSD =
    balances?.items.reduce(
      (sum, b) => sum + BigInt(b.totalReceivedUSD ?? 0),
      0n,
    ) ?? 0n;
  const totalDistributedUSD =
    balances?.items.reduce(
      (sum, b) => sum + BigInt(b.totalDistributedUSD ?? 0),
      0n,
    ) ?? 0n;
  const totalBalanceUSD = totalReceivedUSD - totalDistributedUSD;

  if (isPending) {
    return <StrategyPageSkeleton />;
  }

  if (!strategy) {
    return <StrategyNotFound />;
  }

  const isOwner = address?.toLowerCase() === strategy.owner.toLowerCase();

  return (
    <div className="px-6 py-8 space-y-12">
      {/* Back Link */}
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Strategies
      </Link>

      {/* Hero: Identity + Financial Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 pb-10 border-b">
        <div className="lg:col-span-3">
          <StrategyHeader
            strategy={strategy}
            strategyAddress={strategyAddress}
          />
        </div>
        <div className="lg:col-span-2">
          <StrategyStats
            totalBalanceUSD={totalBalanceUSD}
            totalDistributedUSD={totalDistributedUSD}
            balances={balances?.items}
            strategyAddress={strategyAddress}
          />
        </div>
      </div>
      <ForksList strategyAddress={strategyAddress} />

      <AllocationList
        allocations={strategy.allocations}
        totalWeight={totalWeight}
        totalBalanceUSD={totalBalanceUSD}
        balances={balances?.items}
        strategyAddresses={strategyAddresses}
      />

      <YieldVaultsList strategyAddress={strategyAddress} isOwner={isOwner} />

      <TransactionHistory
        title="Distribution History"
        transactions={distributions?.items?.map((d) => ({
          id: d.id,
          amount: d.totalAmount,
          amountUSD: d.totalAmountUSD,
          token: d.token,
          timestamp: d.timestamp,
          txHash: d.txHash,
        }))}
        emptyState={{
          icon: SendIcon,
          title: "No distributions yet",
          description: "Use the Distribute button to send funds to recipients.",
        }}
      />
    </div>
  );
}

function calculateTotalWeight(
  allocations: { weight: string | bigint }[] | undefined,
): bigint {
  return (
    allocations?.reduce<bigint>((sum, a) => sum + BigInt(a.weight), 0n) ?? 0n
  );
}
