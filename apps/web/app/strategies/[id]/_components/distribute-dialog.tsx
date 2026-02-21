"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { type Address } from "viem";
import { SendIcon } from "lucide-react";

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
import { Label } from "@workspace/ui/components/label";

import { useDistributeStrategy } from "@workspace/sdk";
import { SelectToken } from "@/components/select-token";
import { TokenAmount } from "@/components/token-amount";

interface DistributeDialogProps {
  strategyAddress: Address;
  balances: { token: Address; balance: string }[];
}

interface DistributeFormValues {
  token: Address | undefined;
}

export function DistributeDialog({
  strategyAddress,
  balances,
}: DistributeDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: distribute, isPending } = useDistributeStrategy();

  const { handleSubmit, watch, setValue, reset } =
    useForm<DistributeFormValues>({
      defaultValues: {
        token: undefined,
      },
    });

  const selectedToken = watch("token");

  // Find the balance for the selected token
  const selectedBalance = balances.find((b) => b.token === selectedToken);
  const hasBalance = selectedBalance && BigInt(selectedBalance.balance) > 0n;

  const onSubmit = async (data: DistributeFormValues) => {
    if (!data.token) return;

    try {
      await distribute({
        strategyAddress,
        token: data.token,
      });
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Distribution failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" icon={SendIcon}>
          Distribute
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Distribute Funds</DialogTitle>
            <DialogDescription>
              Distribute the strategy&apos;s token balance to all recipients
              according to their allocation weights.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <SelectToken
                value={selectedToken}
                onValueChange={(value) => setValue("token", value)}
                tokens={balances.map((b) => ({ address: b.token }))}
              />
              {selectedToken && selectedBalance && (
                <p className="text-sm text-muted-foreground">
                  Available:{" "}
                  <TokenAmount
                    amount={selectedBalance.balance}
                    token={selectedToken}
                  />
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!selectedToken || !hasBalance || isPending}
              isLoading={isPending}
            >
              Distribute
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
