"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { GitForkIcon, LayersIcon, UsersIcon, SearchIcon } from "lucide-react";

import type { Strategy } from "@workspace/sdk";

interface ForkStrategyDialogProps {
  strategies: Strategy[];
  currentSourceStrategy?: string;
}

export function ForkStrategyDialog({
  strategies,
  currentSourceStrategy,
}: ForkStrategyDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSelect = (strategyId: string) => {
    router.push(`/strategies/create?sourceStrategy=${strategyId}`);
    setOpen(false);
  };

  // Sort strategies alphabetically by title
  const allStrategies = strategies.sort((a, b) => {
    const aTitle = a.metadata?.title?.toLowerCase() || "";
    const bTitle = b.metadata?.title?.toLowerCase() || "";
    return aTitle.localeCompare(bTitle);
  });

  const renderStrategyItem = (strategy: Strategy) => {
    const isCurrentSource =
      currentSourceStrategy?.toLowerCase() === strategy.id.toLowerCase();

    return (
      <CommandItem
        key={strategy.id}
        value={strategy.metadata?.title || strategy.id}
        keywords={[
          strategy.id,
          strategy.metadata?.title || "",
          strategy.metadata?.description || "",
          "strategy",
        ]}
        disabled={isCurrentSource}
        onSelect={() => handleSelect(strategy.id)}
        className="py-3"
      >
        <div className="flex items-start gap-3 w-full">
          {/* Icon */}
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isCurrentSource
                ? "bg-muted"
                : "bg-purple-100 dark:bg-purple-950/40"
            }`}
          >
            <LayersIcon
              className={`h-4 w-4 ${
                isCurrentSource
                  ? "text-muted-foreground"
                  : "text-purple-600 dark:text-purple-400"
              }`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div>
              <p
                className={`text-sm font-semibold ${
                  isCurrentSource ? "text-muted-foreground" : ""
                }`}
              >
                {strategy.metadata?.title || "Untitled Strategy"}
              </p>
              {strategy.metadata?.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {strategy.metadata.description}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 shrink-0">
                <LayersIcon className="w-3 h-3" />
                {strategy.allocations.length} recipient
                {strategy.allocations.length !== 1 ? "s" : ""}
              </span>

              {strategy.uniqueDonors > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <UsersIcon className="w-3 h-3" />
                    {strategy.uniqueDonors} donor
                    {strategy.uniqueDonors !== 1 ? "s" : ""}
                  </span>
                </>
              )}

              {strategy.timesForked > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <GitForkIcon className="w-3 h-3" />
                    {strategy.timesForked} fork
                    {strategy.timesForked !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Current badge */}
          {isCurrentSource && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              Current
            </Badge>
          )}
        </div>
      </CommandItem>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" icon={GitForkIcon}>
          Browse Strategies
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>Fork a Strategy</DialogTitle>
          <DialogDescription>
            Choose an existing strategy to use as a starting point. All
            allocations and metadata will be copied to your new strategy.
          </DialogDescription>
        </DialogHeader>
        <Command className="border-t rounded-none">
          <CommandInput placeholder="Search strategies..." />
          <CommandList className="max-h-[480px]">
            <CommandEmpty>
              <div className="py-10 text-center space-y-1.5">
                <SearchIcon className="h-5 w-5 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No strategies found
                </p>
                <p className="text-xs text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            </CommandEmpty>

            {/* All strategies */}
            {allStrategies.length > 0 && (
              <CommandGroup heading="All Strategies">
                {allStrategies.map(renderStrategyItem)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
