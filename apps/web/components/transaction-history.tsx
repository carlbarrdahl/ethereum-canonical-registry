"use client";

import { type Address } from "viem";
import { type LucideIcon, ExternalLinkIcon } from "lucide-react";

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

import { TokenAmount } from "@/components/token-amount";
import { USDAmount } from "@/components/amount";
import { timeAgo } from "@/lib/format";

interface Transaction {
  id: string;
  amount: string;
  amountUSD: string;
  token: Address;
  timestamp: bigint;
  txHash: string;
}

interface EmptyState {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface TransactionHistoryProps {
  title: string;
  transactions?: Transaction[];
  emptyState: EmptyState;
}

export function TransactionHistory({
  title,
  transactions,
  emptyState,
}: TransactionHistoryProps) {
  const EmptyIcon = emptyState.icon;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {transactions && transactions.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {transactions.length} {transactions.length !== 1 ? "transactions" : "transaction"}
          </span>
        )}
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="rounded-lg border py-12 text-center space-y-1.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
            <EmptyIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {emptyState.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {emptyState.description}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right w-[100px]">Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const date = new Date(Number(tx.timestamp) * 1000);
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {timeAgo(date)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{date.toLocaleString()}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="font-medium">
                      <TokenAmount amount={tx.amount} token={tx.token} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <USDAmount amount={tx.amountUSD} />
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`https://etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
                      >
                        {tx.txHash.slice(0, 6)}...
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
  );
}

