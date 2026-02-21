"use client";

import Link from "next/link";
import { type Address } from "viem";
import { GitForkIcon, PencilIcon, UsersIcon } from "lucide-react";
import { useAccount } from "wagmi";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

import { EnsName } from "@/components/ens";
import { Markdown } from "@/components/markdown";
import { SetEnsForm } from "./set-ens-form";

interface StrategyHeaderProps {
  strategy: {
    owner: Address;
    sourceStrategy: Address | null;
    uniqueDonors: number;
    timesForked: number;
    ensLabel: string | null;
    metadata?: {
      title?: string;
      description?: string;
    } | null;
  };
  strategyAddress: Address;
}

export function StrategyHeader({
  strategy,
  strategyAddress,
}: StrategyHeaderProps) {
  const { address } = useAccount();
  const isOwner = address?.toLowerCase() === strategy.owner.toLowerCase();

  return (
    <div className="space-y-5">
      {/* Title + secondary actions */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {strategy.metadata?.title || "Untitled Strategy"}
          </h1>
          <div className="flex items-center gap-1 shrink-0 pt-1.5">
            {isOwner && (
              <>
                <Link href={`/strategies/${strategyAddress}/edit`}>
                  <Button variant="ghost" size="sm" icon={PencilIcon}>
                    Edit
                  </Button>
                </Link>
                <SetEnsForm
                  strategyAddress={strategyAddress}
                  currentEnsLabel={strategy.ensLabel}
                />
              </>
            )}
            <Link
              href={`/strategies/create?sourceStrategy=${strategyAddress}`}
            >
              <Button variant="ghost" size="sm" icon={GitForkIcon}>
                Fork
              </Button>
            </Link>
          </div>
        </div>

        {strategy.sourceStrategy && (
          <Link
            href={`/strategies/${strategy.sourceStrategy}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <GitForkIcon className="w-3.5 h-3.5" />
            Forked from <EnsName address={strategy.sourceStrategy} />
          </Link>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
        <Badge variant="outline" className="font-mono text-xs">
          <EnsName address={strategyAddress} length={50} />
        </Badge>
        <span>
          Curated by{" "}
          <span className="text-foreground font-medium">
            <EnsName address={strategy.owner} />
          </span>
        </span>
        <span className="inline-flex items-center gap-1">
          <UsersIcon className="w-3 h-3" />
          {strategy.uniqueDonors} donor
          {strategy.uniqueDonors !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitForkIcon className="w-3 h-3" />
          {strategy.timesForked} fork
          {strategy.timesForked !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Description */}
      {strategy.metadata?.description && (
        <Markdown>{strategy.metadata.description}</Markdown>
      )}
    </div>
  );
}
