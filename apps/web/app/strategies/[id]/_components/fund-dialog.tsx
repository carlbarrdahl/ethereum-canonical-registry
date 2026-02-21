"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { type Address, parseUnits } from "viem";
import { WalletIcon } from "lucide-react";
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

import { getTokens } from "@workspace/sdk";
import { SelectToken } from "@/components/select-token";
import { TokenAmount } from "@/components/token-amount";
import { useToken } from "@/hooks/use-token";
import { useTransfer } from "@/hooks/use-transfer";

interface FundDialogProps {
  strategyAddress: Address;
}

interface FundFormValues {
  token: Address | undefined;
  amount: string;
}

export function FundDialog({ strategyAddress }: FundDialogProps) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } =
    useForm<FundFormValues>({
      defaultValues: {
        token: undefined,
        amount: "",
      },
    });

  const selectedToken = watch("token");
  const amount = watch("amount");

  const chainId = useChainId();
  const { address } = useAccount();
  const { transferAsync, isPending } = useTransfer();
  const queryClient = useQueryClient();

  // Use existing useToken hook instead of manual useReadContracts
  const { data: token } = useToken(selectedToken, address);

  const trackedTokens = getTokens(chainId).map((t) => ({
    address: t.address,
    symbol: t.symbol,
  }));

  const decimals = token?.decimals ?? 18;
  const balance = token?.balance ?? 0n;

  // Check if amount exceeds balance
  const parsedAmount = amount ? parseUnits(amount, decimals) : 0n;
  const insufficientBalance = parsedAmount > balance;

  const onSubmit = async (data: FundFormValues) => {
    if (!data.token || !data.amount || insufficientBalance) return;

    try {
      await transferAsync({
        token: data.token,
        to: strategyAddress,
        amount: parsedAmount,
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["strategy"] });
        queryClient.invalidateQueries({ queryKey: ["strategyBalances"] });
      }, 500);
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button icon={WalletIcon}>Fund</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Fund Strategy</DialogTitle>
            <DialogDescription>
              Transfer tokens or ETH to this strategy. The funds will be
              distributed according to the allocation weights.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <SelectToken
                value={selectedToken}
                onValueChange={(value) => setValue("token", value)}
                tokens={trackedTokens}
              />
            </div>
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
              {selectedToken && (
                <p
                  className={`text-sm ${insufficientBalance ? "text-destructive" : "text-muted-foreground"}`}
                >
                  Balance:{" "}
                  <TokenAmount amount={balance} token={selectedToken} />
                  {insufficientBalance && " (insufficient)"}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                !selectedToken || !amount || isPending || insufficientBalance
              }
              isLoading={isPending}
            >
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
