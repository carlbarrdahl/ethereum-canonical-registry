"use client";

import { useState } from "react";
import { isAddress } from "viem";

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  PlusIcon,
  UserIcon,
  LayersIcon,
  CheckIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  GitForkIcon,
  UsersIcon,
} from "lucide-react";

import type { Strategy } from "@workspace/sdk";

import {
  CONSENSUS_CLIENTS,
  EXECUTION_CLIENTS,
} from "./client-diversity-config";

interface AddDestinationDialogProps {
  strategies: Strategy[];
  existingAddresses: string[];
  onSelect: (recipient: string, label?: string) => void;
  disabled?: boolean;
}

export function AddDestinationDialog({
  strategies,
  existingAddresses,
  onSelect,
  disabled = false,
}: AddDestinationDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const recipients = [...CONSENSUS_CLIENTS, ...EXECUTION_CLIENTS];

  const isValidAddress = searchQuery ? isAddress(searchQuery) : false;

  const isAddressAlreadyAdded = (address: string) => {
    return existingAddresses.some(
      (existing) => existing?.toLowerCase() === address?.toLowerCase(),
    );
  };

  const isSearchAddressAlreadyAdded =
    isValidAddress && isAddressAlreadyAdded(searchQuery);

  const handleSelect = (recipient: string, label?: string) => {
    onSelect(recipient, label);
    setOpen(false);
    setSearchQuery("");
  };

  const handleAddManualAddress = () => {
    if (isValidAddress && !isSearchAddressAlreadyAdded) {
      handleSelect(searchQuery);
    }
  };

  const renderRecipientItem = (
    recipient: { recipient: string; label: string },
    index: number,
  ) => {
    const isAlready = isAddressAlreadyAdded(recipient.recipient);

    return (
      <CommandItem
        key={index}
        value={recipient.label}
        keywords={[recipient.recipient, recipient.label, "recipient", "user"]}
        disabled={isAlready}
        onSelect={() => handleSelect(recipient.recipient, recipient.label)}
        className="py-3"
      >
        <div className="flex items-start gap-3 w-full">
          {/* Icon */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAlready ? "bg-muted" : "bg-blue-100 dark:bg-blue-950/40"}`}
          >
            {isAlready ? (
              <CheckIcon className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <UserIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <p
              className={`text-sm font-semibold ${isAlready ? "text-muted-foreground" : ""}`}
            >
              {recipient.label}
            </p>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {recipient.recipient.slice(0, 6)}...
              {recipient.recipient.slice(-4)}
            </p>
          </div>

          {/* Badge */}
          {isAlready && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              Added
            </Badge>
          )}
        </div>
      </CommandItem>
    );
  };

  const renderStrategyItem = (strategy: Strategy) => {
    const isAlready = isAddressAlreadyAdded(strategy.id);

    return (
      <CommandItem
        key={strategy.id}
        value={strategy.metadata?.title || strategy.id}
        keywords={[
          strategy.id,
          strategy.metadata?.title || "",
          strategy.metadata?.description || "",
          "strategy",
          "split",
        ]}
        disabled={isAlready}
        onSelect={() => handleSelect(strategy.id, strategy.metadata?.title)}
        className="py-3"
      >
        <div className="flex items-start gap-3 w-full">
          {/* Icon */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isAlready ? "bg-muted" : "bg-purple-100 dark:bg-purple-950/40"}`}
          >
            {isAlready ? (
              <CheckIcon className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <LayersIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <p
              className={`text-sm font-semibold ${isAlready ? "text-muted-foreground" : ""}`}
            >
              {strategy.metadata?.title || "Untitled Strategy"}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 shrink-0 font-mono">
                {strategy.id.slice(0, 6)}...{strategy.id.slice(-4)}
              </span>

              {strategy.uniqueDonors > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <UsersIcon className="w-3 h-3" />
                    {strategy.uniqueDonors}
                  </span>
                </>
              )}

              {strategy.timesForked > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <GitForkIcon className="w-3 h-3" />
                    {strategy.timesForked}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Badge */}
          {isAlready && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              Added
            </Badge>
          )}
        </div>
      </CommandItem>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              icon={PlusIcon}
              disabled={disabled}
            >
              Add Recipient
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        {disabled && (
          <TooltipContent>
            <p>Connect your wallet to add recipients</p>
          </TooltipContent>
        )}
      </Tooltip>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>Add Recipient</DialogTitle>
          <DialogDescription>
            Search known recipients and strategies, or paste any Ethereum
            address.
          </DialogDescription>
        </DialogHeader>
        <Command
          className="border-t rounded-none"
          shouldFilter={!isValidAddress}
        >
          <CommandInput
            placeholder="Search or paste 0x address..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValidAddress) {
                e.preventDefault();
                handleAddManualAddress();
              }
            }}
          />
          <CommandList className="max-h-[360px]">
            <CommandEmpty>
              {isValidAddress ? (
                <div className="p-3">
                  <div
                    className={`rounded-lg border p-3 ${isSearchAddressAlreadyAdded ? "border-muted bg-muted/30" : "border-primary/20 bg-primary/5"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSearchAddressAlreadyAdded ? "bg-muted" : "bg-primary/10"}`}
                      >
                        {isSearchAddressAlreadyAdded ? (
                          <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <p className="text-sm font-medium">
                            {isSearchAddressAlreadyAdded
                              ? "Already in your allocations"
                              : "Valid Ethereum address"}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground truncate">
                            {searchQuery}
                          </p>
                        </div>
                        {!isSearchAddressAlreadyAdded && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddManualAddress}
                          >
                            <CheckIcon className="h-3.5 w-3.5 mr-1.5" />
                            Add Address
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-1.5">
                  <SearchIcon className="h-5 w-5 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No results found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Paste a valid 0x address to add it directly.
                  </p>
                </div>
              )}
            </CommandEmpty>

            {!isValidAddress && (
              <>
                {/* Known recipients */}
                <CommandGroup heading="Known Recipients">
                  {recipients.map(renderRecipientItem)}
                </CommandGroup>

                {/* Strategies */}
                {strategies.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Strategies">
                      {strategies.map(renderStrategyItem)}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
