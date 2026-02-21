"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { type Address, isAddress } from "viem";
import {
  PiggyBankIcon,
  PlusIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  InfoIcon,
  KeyboardIcon,
} from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useCreateYieldRedirector, getVaults } from "@workspace/sdk";

interface ConnectYieldVaultDialogProps {
  strategyAddress: Address;
  isOwner: boolean;
}

interface ConnectVaultFormValues {
  vaultAddress: string;
  useCustomAddress: boolean;
}

export function ConnectYieldVaultDialog({
  strategyAddress,
  isOwner,
}: ConnectYieldVaultDialogProps) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } =
    useForm<ConnectVaultFormValues>({
      defaultValues: {
        vaultAddress: "",
        useCustomAddress: false,
      },
    });

  const vaultAddress = watch("vaultAddress");
  const useCustomAddress = watch("useCustomAddress");
  const isValidAddress = !vaultAddress || isAddress(vaultAddress);

  const { address } = useAccount();
  const chainId = useChainId();
  const { mutateAsync: createRedirector, isPending } =
    useCreateYieldRedirector({
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });
  const queryClient = useQueryClient();

  const availableVaults = getVaults(chainId);

  const onSubmit = async (data: ConnectVaultFormValues) => {
    if (!isValidAddress || !address) return;

    try {
      await createRedirector({
        sourceVault: data.vaultAddress as Address,
        yieldRecipient: strategyAddress,
        owner: address,
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["yieldRedirectors"] });
        queryClient.invalidateQueries({
          queryKey: [
            "yieldRedirectors",
            { where: { yieldRecipient: strategyAddress } },
          ],
        });
      }, 500);
    } catch (err: any) {
      // Error toast is handled by the hook
      console.error("Failed to create yield redirector:", err);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" icon={PlusIcon}>
          Connect Vault
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Connect Yield Vault
            </DialogTitle>
            <DialogDescription>
              Connect an ERC-4626 vault to automatically direct yield to this
              strategy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Vault selection */}
            {availableVaults.length > 0 && !useCustomAddress ? (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Select a vault
                </Label>
                <div className="space-y-1.5">
                  {availableVaults.map((vault) => {
                    const isSelected = vaultAddress === vault.address;
                    return (
                      <button
                        key={vault.address}
                        type="button"
                        onClick={() => setValue("vaultAddress", vault.address)}
                        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          ></div>
                          <div>
                            <p className="text-sm font-medium">{vault.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {vault.symbol}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2Icon className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValue("useCustomAddress", true);
                    setValue("vaultAddress", "");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                >
                  <KeyboardIcon className="h-3 w-3" />
                  Enter custom vault address
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label
                  htmlFor="vaultAddress"
                  className="text-xs uppercase tracking-wider text-muted-foreground"
                >
                  ERC-4626 Vault Address
                </Label>
                <Input
                  id="vaultAddress"
                  placeholder="0x..."
                  className="font-mono text-sm"
                  {...register("vaultAddress")}
                />
                {vaultAddress && !isValidAddress && (
                  <p className="text-xs text-destructive">
                    Please enter a valid address
                  </p>
                )}
                {vaultAddress && isValidAddress && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2Icon className="h-3 w-3" />
                    Valid address
                  </p>
                )}
                {!vaultAddress && (
                  <p className="text-xs text-muted-foreground">
                    Supports Morpho, Euler, Yearn, and other ERC-4626 vaults.
                  </p>
                )}
                {availableVaults.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("useCustomAddress", false);
                      setValue("vaultAddress", "");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                  >
                    <PiggyBankIcon className="h-3 w-3" />
                    Select from available vaults
                  </button>
                )}
              </div>
            )}

            {/* How it works */}
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  How it works
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span>Deposit</span>
                <ArrowRightIcon className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Earn yield in vault</span>
                <ArrowRightIcon className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Harvest to strategy</span>
                <ArrowRightIcon className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Distribute to recipients</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    type="submit"
                    disabled={!vaultAddress || !isValidAddress || isPending}
                    isLoading={isPending}
                    className="w-full sm:w-auto"
                  >
                    Create Yield Redirector
                  </Button>
                </div>
              </TooltipTrigger>
              {(!vaultAddress || !isValidAddress) && (
                <TooltipContent>
                  {!vaultAddress
                    ? "Select or enter a vault address"
                    : "Enter a valid address"}
                </TooltipContent>
              )}
            </Tooltip>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
