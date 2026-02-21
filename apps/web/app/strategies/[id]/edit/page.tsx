"use client";

import { use } from "react";
import { type Address } from "viem";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useStrategyById } from "@workspace/sdk";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { CreateStrategyForm } from "../../create/form";

export default function EditStrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const strategyAddress = id as Address;
  const { address } = useAccount();
  const router = useRouter();

  const { data: strategy, isLoading } = useStrategyById(strategyAddress);

  // Check ownership
  const isOwner = address?.toLowerCase() === strategy?.owner.toLowerCase();

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Strategy not found</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Only the strategy owner can edit this strategy
        </p>
      </div>
    );
  }

  return (
    <CreateStrategyForm
      mode="edit"
      strategyAddress={strategyAddress}
      strategy={strategy}
    />
  );
}
