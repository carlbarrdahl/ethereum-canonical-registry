import Link from "next/link";
import { UsersIcon, LayersIcon, GitForkIcon } from "lucide-react";
import { ENS_DOMAIN } from "@ethereum-entity-registry/sdk";
import { truncate } from "@/lib/truncate";
import { EnsName } from "@/components/ens";
import { USDAmount } from "@/components/amount";
import { getColorForAddress } from "@/lib/color-utils";
import { Markdown } from "@/components/markdown";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@ethereum-entity-registry/ui/components/hover-card";
import type { Address } from "viem";

interface StrategyCardProps {
  strategy: {
    id: Address;
    ensLabel?: string | null;
    metadata?: {
      title?: string;
      description?: string;
    } | null;
    owner: Address;
    allocations: Array<{
      recipient: Address;
      weight: string;
      label?: string | null;
    }>;
    uniqueDonors: number;
    timesForked: number;
  };
  allocatedUSD: bigint;
}

export function StrategyCard({ strategy: s, allocatedUSD }: StrategyCardProps) {
  const allocations = s.allocations ?? [];
  const totalWeight = allocations.reduce(
    (sum, a) => sum + BigInt(a.weight),
    0n,
  );

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link
          key={s.id}
          href={`/strategies/${s.id}`}
          className="block group h-full"
        >
          <div className="rounded-lg border overflow-hidden h-full flex flex-col transition-colors hover:border-muted-foreground/25">
            {/* Mini allocation bar */}
            {allocations.length > 0 && totalWeight > 0n ? (
              <div className="flex h-2 w-full bg-muted">
                {allocations.map((alloc) => {
                  const pct =
                    Number((BigInt(alloc.weight) * 10000n) / totalWeight) / 100;
                  return (
                    <div
                      key={alloc.recipient}
                      className={getColorForAddress(alloc.recipient)}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="h-2 w-full bg-muted" />
            )}

            <div className="p-4 flex flex-col gap-4 flex-1">
              {/* Title + subdomain + curator */}
              <div className="space-y-1 min-w-0 flex-1">
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {s.metadata.title}
                </p>
                {s.ensLabel && s.metadata?.title && (
                  <p className="text-xs text-muted-foreground truncate">
                    {s.ensLabel
                      ? `${s.ensLabel}.${ENS_DOMAIN}`
                      : s.metadata?.title || truncate(s.id, 16)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate">
                  by <EnsName address={s.owner} />
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between gap-3 text-xs pt-3 border-t">
                <span className="font-semibold text-sm tabular-nums">
                  <USDAmount amount={allocatedUSD} compact />
                </span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <LayersIcon className="w-3.5 h-3.5" />
                    {allocations.length}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon className="w-3.5 h-3.5" />
                    {s.uniqueDonors}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitForkIcon className="w-3.5 h-3.5" />
                    {s.timesForked}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </HoverCardTrigger>

      <HoverCardContent side="top" align="start" className="w-80">
        <div className="space-y-4">
          {/* Description */}
          {s.metadata?.description && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold">{s.metadata.title}</h4>
              <Markdown className="text-xs text-muted-foreground prose-sm line-clamp-3">
                {s.metadata.description}
              </Markdown>
            </div>
          )}

          {/* Allocation Details */}
          {allocations.length > 0 && (
            <div className="space-y-2 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Allocations
              </p>
              <div className="space-y-2">
                {allocations.map((alloc) => {
                  const pct =
                    Number((BigInt(alloc.weight) * 10000n) / totalWeight) / 100;
                  return (
                    <div
                      key={alloc.recipient}
                      className="flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${getColorForAddress(alloc.recipient)}`}
                        />
                        <span className="truncate">
                          {alloc.label || <EnsName address={alloc.recipient} />}
                        </span>
                      </div>
                      <span className="font-medium tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
