"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  type Address,
  parseUnits,
  erc4626Abi,
  erc20Abi,
  maxUint256,
} from "viem";
import { CoinsIcon } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

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
import { Alert, AlertDescription } from "@workspace/ui/components/alert";

import { TokenAmount } from "@/components/token-amount";
import { useToken } from "@/hooks/use-token";

interface VaultDepositDialogProps {
  vaultAddress: Address;
  asset: Address;
}

interface DepositFormValues {
  amount: string;
}

export function VaultDepositDialog({
  vaultAddress,
  asset,
}: VaultDepositDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  const { register, handleSubmit, watch, reset } = useForm<DepositFormValues>({
    defaultValues: {
      amount: "",
    },
  });

  const amount = watch("amount");

  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Get token info
  const { data: token } = useToken(asset, address);

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: asset,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, vaultAddress] : undefined,
    query: { enabled: Boolean(address) },
  });

  // Contract write hooks
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isPending = isWritePending || isConfirming;

  const decimals = token?.decimals ?? 18;
  const balance = token?.balance ?? 0n;

  // Check if amount exceeds balance
  const parsedAmount = amount ? parseUnits(amount, decimals) : 0n;
  const insufficientBalance = parsedAmount > balance;

  // Check if approval is needed when amount changes
  useEffect(() => {
    if (amount && allowance !== undefined) {
      const parsedAmount = parseUnits(amount, token?.decimals ?? 18);
      setNeedsApproval(allowance < parsedAmount);
    }
  }, [amount, allowance, token?.decimals]);

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isSuccess && needsApproval) {
      refetchAllowance();
    }
  }, [isSuccess, needsApproval, refetchAllowance]);

  const handleApprove = async () => {
    if (!address) return;

    setError(null);
    writeContract(
      {
        address: asset,
        abi: erc20Abi,
        functionName: "approve",
        args: [vaultAddress, maxUint256],
      },
      {
        onSuccess: () => {
        },
        onError: (err) => {
          console.error("Approval failed:", err);
          setError(err.message || "Approval failed");
        },
      },
    );
  };

  const onSubmit = async (data: DepositFormValues) => {
    if (!data.amount || insufficientBalance || !address) return;

    setError(null);

    // If approval is needed, request approval first
    if (needsApproval) {
      handleApprove();
      return;
    }

    try {
      // Deposit into the YieldRedirector4626 (ERC-4626 vault)
      writeContract(
        {
          address: vaultAddress,
          abi: erc4626Abi,
          functionName: "deposit",
          args: [parsedAmount, address],
        },
        {
          onSuccess: () => {
            setTimeout(() => {
              queryClient.invalidateQueries({
                queryKey: ["yieldRedirector", vaultAddress],
              });
              queryClient.invalidateQueries({
                queryKey: ["yieldRedirectors"],
              });
            }, 1000);
            setOpen(false);
            reset();
          },
          onError: (err) => {
            console.error("Deposit failed:", err);
            setError(err.message || "Deposit failed");
          },
        },
      );
    } catch (err: any) {
      console.error("Deposit failed:", err);
      setError(err.message || "Deposit failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" icon={CoinsIcon}>
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Deposit to Vault</DialogTitle>
            <DialogDescription>
              Deposit assets into this yield vault. Your principal will be
              preserved and withdrawable. All yield will be directed to the
              strategy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.0001}
                {...register("amount")}
              />
              {asset && (
                <p
                  className={`text-sm ${insufficientBalance ? "text-destructive" : "text-muted-foreground"}`}
                >
                  Balance: <TokenAmount amount={balance} token={asset} />
                  {insufficientBalance && " (insufficient)"}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {needsApproval && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Approval Required:</strong> You need to approve this
                  vault to spend your tokens before depositing.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!amount || isPending || insufficientBalance}
              isLoading={isPending}
            >
              {isConfirming
                ? "Confirming..."
                : needsApproval
                  ? "Approve"
                  : "Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
