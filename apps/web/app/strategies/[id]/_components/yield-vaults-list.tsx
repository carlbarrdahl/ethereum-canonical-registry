"use client";

import Link from "next/link";
import { type Address } from "viem";
import {
  PiggyBankIcon,
  TrendingUpIcon,
  ExternalLinkIcon,
  ClockIcon,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useYieldRedirectors, useHarvestYield } from "@workspace/sdk";
import { TokenAmount } from "@/components/token-amount";
import { EnsName } from "@/components/ens";
import { timeAgo } from "@/lib/format";
import { VaultDepositDialog } from "./vault-deposit-dialog";
import { AvailableYield } from "./available-yield";
import { ConnectYieldVaultDialog } from "./connect-yield-vault-dialog";

interface YieldVaultsListProps {
  strategyAddress: Address;
  isOwner: boolean;
}

export function YieldVaultsList({
  strategyAddress,
  isOwner,
}: YieldVaultsListProps) {
  const { data: redirectors, isLoading } = useYieldRedirectors({
    where: { yieldRecipient: strategyAddress },
  });

  const { mutate: harvest, isPending, variables } = useHarvestYield();
  if (isLoading) {
    return (
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Yield Vaults</h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!redirectors?.items.length) {
    return (
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Yield Vaults</h2>
        </div>
        <div className="rounded-lg border py-12 text-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-2">
            <PiggyBankIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No yield vaults connected
          </p>
          <p className="text-xs text-muted-foreground">
            Connect an ERC-4626 vault to earn yield for this strategy.
          </p>
          <ConnectYieldVaultDialog
            strategyAddress={strategyAddress}
            isOwner={isOwner}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Yield Vaults</h2>
          <p className="text-sm text-muted-foreground">
            ERC-4626 vaults directing yield to this strategy.
          </p>
        </div>
        <ConnectYieldVaultDialog
          strategyAddress={strategyAddress}
          isOwner={isOwner}
        />
      </div>

      <div className="space-y-3">
        {redirectors.items.map((redirector) => {
          const lastHarvestDate = redirector.lastHarvestAt
            ? new Date(Number(redirector.lastHarvestAt) * 1000)
            : null;

          return (
            <div
              key={redirector.id}
              className="rounded-lg border transition-colors"
            >
              {/* Vault header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="min-w-0">
                    <Link
                      href={`/vaults/${redirector.id}`}
                      className="text-sm font-medium hover:underline inline-flex items-center gap-1.5"
                    >
                      {redirector.name || <EnsName address={redirector.id} length={16} />}
                      {redirector.symbol && (
                        <span className="text-xs text-muted-foreground font-normal">
                          ({redirector.symbol})
                        </span>
                      )}
                      <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Source:{" "}
                      <span className="font-mono">
                        <EnsName address={redirector.sourceVault} length={12} />
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <VaultDepositDialog
                    vaultAddress={redirector.id}
                    asset={redirector.asset}
                  />
                  <Button
                    variant="default"
                    size="sm"
                    icon={TrendingUpIcon}
                    onClick={() => harvest(redirector.id)}
                    disabled={isPending && variables === redirector.id}
                    isLoading={isPending && variables === redirector.id}
                    loadingText="Harvesting..."
                  >
                    Harvest
                  </Button>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x">
                <div className="px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Principal
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    <TokenAmount
                      amount={BigInt(redirector.principal)}
                      token={redirector.asset}
                    />
                  </p>
                </div>

                <div className="px-4 py-3 bg-green-50/50 dark:bg-green-950/10">
                  <p className="text-[11px] uppercase tracking-wider text-green-700 dark:text-green-400 mb-0.5">
                    Available Yield
                  </p>
                  <div className="text-sm font-semibold tabular-nums">
                    <AvailableYield
                      vaultAddress={redirector.id}
                      asset={redirector.asset}
                    />
                  </div>
                </div>

                <div className="px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Total Harvested
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    <TokenAmount
                      amount={BigInt(redirector.totalHarvested)}
                      token={redirector.asset}
                    />
                  </p>
                </div>

                <div className="px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Harvests
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums">
                      {redirector.harvestCount}
                    </p>
                    {lastHarvestDate && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <ClockIcon className="h-2.5 w-2.5" />
                            {timeAgo(lastHarvestDate)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Last harvested: {lastHarvestDate.toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

