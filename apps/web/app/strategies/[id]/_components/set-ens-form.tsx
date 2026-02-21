"use client";

import { useState, useEffect } from "react";
import { type Address } from "viem";
import { LinkIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

import { ENS_DOMAIN, useSetENSName } from "@workspace/sdk";

interface SetEnsFormProps {
  strategyAddress: Address;
  currentEnsLabel: string | null;
}

interface FormData {
  ensLabel: string;
}

export function SetEnsForm({
  strategyAddress,
  currentEnsLabel,
}: SetEnsFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const setENSName = useSetENSName();
  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      ensLabel: currentEnsLabel || "",
    },
  });

  // Reset form with current ENS label when popover opens
  useEffect(() => {
    if (isOpen) {
      reset({ ensLabel: currentEnsLabel || "" });
    }
  }, [isOpen, currentEnsLabel, reset]);

  const onSubmit = (data: FormData) => {
    if (!data.ensLabel.trim()) {
      toast.error("Please enter a valid ENS label");
      return;
    }

    setENSName.mutate(
      {
        strategyAddress,
        label: data.ensLabel.trim(),
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        },
      },
    );
  };

  const buttonText = currentEnsLabel ? "Change ENS" : "Set ENS";
  const titleText = currentEnsLabel
    ? "Change ENS Subdomain"
    : "Set ENS Subdomain";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" icon={LinkIcon}>
          {buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{titleText}</h4>
            {currentEnsLabel ? (
              <p className="text-xs text-muted-foreground">
                Current: <span className="font-mono">{currentEnsLabel}</span>
                .{ENS_DOMAIN}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Connect an ENS subdomain to your strategy. The name will
                resolve to your strategy address.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              {...register("ensLabel")}
              placeholder="mystrategy"
              disabled={setENSName.isPending}
              autoFocus
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              .{ENS_DOMAIN}
            </span>
          </div>

          <Button
            type="submit"
            disabled={setENSName.isPending}
            className="w-full"
          >
            {setENSName.isPending
              ? currentEnsLabel
                ? "Changing..."
                : "Setting..."
              : currentEnsLabel
                ? "Change ENS"
                : "Set ENS"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
