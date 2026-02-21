"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { type Address } from "viem";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import {
  ArrowLeftIcon,
  CoinsIcon,
  Loader2Icon,
  WalletIcon,
  AlertCircleIcon,
} from "lucide-react";

import {
  useWarehouseBalances,
  useWithdrawFromWarehouse,
  getTokenByAddress,
  isNativeToken,
} from "@workspace/sdk";
import { Amount } from "@/components/amount";

export default function WalletPage() {
  const { address, chainId } = useAccount();
  const [withdrawingToken, setWithdrawingToken] = useState<Address | null>(
    null,
  );

  // Query warehouse balances for connected user
  const { data: balancesData, isPending, isError, refetch } = useWarehouseBalances(
    {
      where: address ? { user: address.toLowerCase() } : undefined,
      orderBy: "totalEarned",
      orderDirection: "desc",
    },
    { enabled: Boolean(address), refetchInterval: 10000 },
  );

  const { mutateAsync: withdraw, isPending: isWithdrawing } =
    useWithdrawFromWarehouse();

  const balances = balancesData?.items ?? [];
  const hasBalances =
    balances.length > 0 && balances.some((b) => BigInt(b.balance) > 0n);

  async function handleWithdraw(tokenAddress: Address) {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setWithdrawingToken(tokenAddress);

    try {
      await withdraw({ owner: address, token: tokenAddress });
    } finally {
      setWithdrawingToken(null);
    }
  }

  function getTokenInfo(tokenAddress: Address) {
    if (isNativeToken(tokenAddress)) {
      return { symbol: "ETH", name: "Ether", decimals: 18 };
    }
    const token = chainId ? getTokenByAddress(chainId, tokenAddress) : null;
    return token ?? { symbol: "???", name: "Unknown Token", decimals: 18 };
  }

  return (
    <div className="px-6 py-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          My Wallet
        </h1>
        <p className="text-muted-foreground">
          View and claim your earnings from strategy distributions.
        </p>
      </div>

      {/* Not Connected */}
      {!address && (
        <div className="rounded-lg border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <WalletIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium mb-1">Wallet not connected</p>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your claimable balances.
          </p>
        </div>
      )}

      {/* Error */}
      {address && isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
            <AlertCircleIcon className="w-6 h-6 text-destructive" />
          </div>
          <p className="font-medium mb-1">Failed to load balances</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading your wallet balances.
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {/* Loading */}
      {address && isPending && !isError && (
        <div className="rounded-lg border py-16 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2Icon className="w-4 h-4 animate-spin" />
          Loading your balances...
        </div>
      )}

      {/* Balances */}
      {address && !isPending && !isError && (
        <section className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Claimable Balances
              </h2>
              <p className="text-sm text-muted-foreground">
                Earnings from strategy distributions, held in the Splits
                Warehouse.
              </p>
            </div>
            {balances.length > 0 && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {balances.length} token{balances.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {!hasBalances ? (
            <div className="rounded-lg border py-12 text-center space-y-1.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                <CoinsIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No claimable balances
              </p>
              <p className="text-xs text-muted-foreground">
                You&apos;ll see balances here when you receive distributions
                from strategies.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead className="text-right">Claimable</TableHead>
                    <TableHead className="text-right">Total Earned</TableHead>
                    <TableHead className="text-right">Total Claimed</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => {
                    const token = getTokenInfo(balance.token);
                    const claimable = BigInt(balance.balance);
                    const isClaimable = claimable > 0n;

                    return (
                      <TableRow key={balance.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{token.symbol}</span>
                            <span className="text-xs text-muted-foreground">
                              {token.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isClaimable ? (
                            <Amount
                              amount={claimable}
                              decimals={token.decimals}
                              symbol={token.symbol}
                              className="font-semibold text-green-600 dark:text-green-400"
                            />
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Amount
                            amount={BigInt(balance.totalEarned)}
                            decimals={token.decimals}
                            symbol={token.symbol}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Amount
                            amount={BigInt(balance.totalClaimed)}
                            decimals={token.decimals}
                            symbol={token.symbol}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={
                              !isClaimable ||
                              isWithdrawing ||
                              withdrawingToken === balance.token
                            }
                            isLoading={withdrawingToken === balance.token}
                            onClick={() =>
                              handleWithdraw(balance.token as Address)
                            }
                          >
                            {withdrawingToken === balance.token
                              ? "Claiming..."
                              : "Claim"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
