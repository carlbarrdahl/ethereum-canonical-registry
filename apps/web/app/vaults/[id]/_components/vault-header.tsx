"use client";

import Link from "next/link";
import { type Address } from "viem";
import { LinkIcon } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";

import { EnsName } from "@/components/ens";

interface VaultHeaderProps {
  vault: {
    name?: string;
    symbol?: string;
    owner: Address;
    sourceVault: Address;
    yieldRecipient: Address;
    asset: Address;
  };
  vaultAddress: Address;
}

export function VaultHeader({ vault, vaultAddress }: VaultHeaderProps) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {vault.name || <EnsName address={vaultAddress} length={20} />}
          {vault.symbol && (
            <span className="text-2xl md:text-3xl text-muted-foreground font-normal ml-2">
              ({vault.symbol})
            </span>
          )}
        </h1>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
        <Badge variant="outline" className="font-mono text-xs">
          <EnsName address={vaultAddress} length={50} />
        </Badge>
        <span>
          Owner{" "}
          <span className="text-foreground font-medium">
            <EnsName address={vault.owner} />
          </span>
        </span>
      </div>

      {/* Links */}
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <p className="inline-flex items-center gap-1.5">
          <LinkIcon className="w-3 h-3 shrink-0" />
          Source Vault:{" "}
          <span className="font-mono text-xs">
            <EnsName address={vault.sourceVault} length={20} />
          </span>
        </p>
        <p className="inline-flex items-center gap-1.5">
          <LinkIcon className="w-3 h-3 shrink-0" />
          Strategy:{" "}
          <Link
            href={`/strategies/${vault.yieldRecipient}`}
            className="text-primary hover:underline font-mono text-xs"
          >
            <EnsName address={vault.yieldRecipient} length={20} />
          </Link>
        </p>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-2xl">
        This vault wraps an ERC-4626 vault and redirects all yield to a
        strategy. Your principal is preserved and always withdrawable. The yield
        is automatically distributed to the strategy&apos;s recipients.
      </p>
    </div>
  );
}
