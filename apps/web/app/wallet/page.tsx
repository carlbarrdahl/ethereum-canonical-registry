"use client";

import { useAccount } from "wagmi";
import Link from "next/link";

import { Button } from "@ethereum-entity-registry/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ethereum-entity-registry/ui/components/table";
import { Badge } from "@ethereum-entity-registry/ui/components/badge";
import {
  ArrowLeftIcon,
  Loader2Icon,
  WalletIcon,
  AlertCircleIcon,
  LinkIcon,
} from "lucide-react";

import {
  useIdentifiers,
} from "@ethereum-entity-registry/sdk";

export default function WalletPage() {
  const { address } = useAccount();

  const { data: identifiersData, isPending: isIdentifiersPending, isError, refetch } =
    useIdentifiers(
      { where: address ? { owner: address.toLowerCase() } : undefined },
      { enabled: Boolean(address) },
    );

  const identifiers = identifiersData?.items ?? [];

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
          View your claimed identifiers and manage your identity accounts.
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
            Connect your wallet to view your identifiers.
          </p>
        </div>
      )}

      {/* Error */}
      {address && isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
            <AlertCircleIcon className="w-6 h-6 text-destructive" />
          </div>
          <p className="font-medium mb-1">Failed to load identifiers</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading your identifiers.
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {/* Loading */}
      {address && isIdentifiersPending && !isError && (
        <div className="rounded-lg border py-16 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2Icon className="w-4 h-4 animate-spin" />
          Loading your identifiers...
        </div>
      )}

      {/* Identifiers */}
      {address && !isIdentifiersPending && !isError && (
        <section className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Connected Identifiers
              </h2>
              <p className="text-sm text-muted-foreground">
                Identifiers linked to your wallet in the canonical registry.
              </p>
            </div>
            {identifiers.length > 0 && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {identifiers.length} identifier
                {identifiers.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {identifiers.length === 0 ? (
            <div className="rounded-lg border py-12 text-center space-y-1.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No identifiers found
              </p>
              <p className="text-xs text-muted-foreground">
                Prove ownership of an identifier to link it to your wallet.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Claimed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {identifiers.map((identifier) => (
                    <TableRow key={identifier.id}>
                      <TableCell className="font-mono text-sm">
                        {identifier.canonicalString}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {identifier.id.slice(0, 6)}…{identifier.id.slice(-4)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {identifier.namespace}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {identifier.revokedAt ? (
                          <Badge variant="destructive" className="text-xs">
                            Revoked
                          </Badge>
                        ) : identifier.claimedAt ? (
                          <Badge variant="default" className="text-xs">
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Unclaimed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {identifier.claimedAt
                          ? new Date(
                              Number(identifier.claimedAt) * 1000,
                            ).toLocaleDateString()
                          : "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
