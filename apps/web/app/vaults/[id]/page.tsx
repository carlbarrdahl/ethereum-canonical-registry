"use client";

import { use } from "react";
import Link from "next/link";
import { type Address } from "viem";
import { ArrowLeftIcon, VaultIcon, TrendingUpIcon } from "lucide-react";

import { Skeleton } from "@workspace/ui/components/skeleton";

import { useYieldRedirectorById, useHarvests } from "@workspace/sdk";

import { TransactionHistory } from "@/components/transaction-history";
import { VaultHeader, VaultStats } from "./_components";

function VaultPageSkeleton() {
  return (
    <div className="px-6 py-8 space-y-10">
      <Skeleton className="h-4 w-28" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function VaultNotFound() {
  return (
    <div className="px-6 py-8 space-y-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Strategies
      </Link>
      <div className="rounded-lg border py-12 text-center space-y-1.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
          <VaultIcon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Vault not found
        </p>
        <p className="text-xs text-muted-foreground">
          This vault may have been removed or the address is invalid.
        </p>
      </div>
    </div>
  );
}

export default function VaultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const vaultAddress = id as Address;

  const { data: vault, isPending } = useYieldRedirectorById(vaultAddress, {
    refetchInterval: (s) => {
      return !!s.state.data ? -1 : 1000;
    },
  });

  const { data: harvests } = useHarvests({
    where: { redirectorId: vaultAddress },
    orderBy: "timestamp",
    orderDirection: "desc",
    limit: 10,
  });

  if (isPending) {
    return <VaultPageSkeleton />;
  }

  if (!vault) {
    return <VaultNotFound />;
  }

  return (
    <div className="px-6 py-8 space-y-12">
      {/* Back Link */}
      <Link
        href={`/strategies/${vault.yieldRecipient}`}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Strategy
      </Link>

      {/* Hero: Identity + Financial Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 pb-10 border-b">
        <div className="lg:col-span-3">
          <VaultHeader vault={vault} vaultAddress={vaultAddress} />
        </div>
        <div className="lg:col-span-2">
          <VaultStats vault={vault} vaultAddress={vaultAddress} />
        </div>
      </div>

      <TransactionHistory
        title="Harvest History"
        transactions={harvests?.items?.map(h => ({
          id: h.id,
          amount: h.amount,
          amountUSD: h.amountUSD,
          token: vault.asset,
          timestamp: h.timestamp,
          txHash: h.txHash,
        }))}
        emptyState={{
          icon: TrendingUpIcon,
          title: "No harvests yet",
          description: "Harvest yield when it accumulates in the vault.",
        }}
      />
    </div>
  );
}
