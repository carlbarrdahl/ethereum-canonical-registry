"use client";

import { type Address } from "viem";
import { WalletIcon, ArrowUpRightIcon } from "lucide-react";

import { TokenAmount } from "@/components/token-amount";
import { USDAmount } from "@/components/amount";
import { FundDialog } from "./fund-dialog";
import { DistributeDialog } from "./distribute-dialog";

interface StrategyStatsProps {
  totalBalanceUSD: bigint;
  totalDistributedUSD: bigint;
  balances:
    | {
        token: Address;
        balance: string;
        totalDistributed: string;
      }[]
    | undefined;
  strategyAddress: Address;
}

export function StrategyStats({
  totalBalanceUSD,
  totalDistributedUSD,
  balances,
  strategyAddress,
}: StrategyStatsProps) {
  return (
    <div className="space-y-8">
      {/* Financial stats */}
      <div className="space-y-6">
        {/* Balance */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <WalletIcon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Balance
            </span>
          </div>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            <USDAmount amount={totalBalanceUSD} />
          </p>
          {balances && balances.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {balances.map((b) => (
                <span key={b.token}>
                  <TokenAmount amount={b.balance} token={b.token} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Distributed */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpRightIcon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Distributed
            </span>
          </div>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            <USDAmount amount={totalDistributedUSD} />
          </p>
          {balances && balances.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {balances.map((b) => (
                <span key={b.token}>
                  <TokenAmount amount={b.totalDistributed} token={b.token} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary actions */}
      <div className="flex items-center gap-2">
        <FundDialog strategyAddress={strategyAddress} />
        <DistributeDialog
          strategyAddress={strategyAddress}
          balances={balances ?? []}
        />
      </div>
    </div>
  );
}
