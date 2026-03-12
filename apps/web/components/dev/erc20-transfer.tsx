"use client";

import { useState, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { type Address, isAddress, parseUnits } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useToken } from "@/hooks/use-token";
import { useTransfer } from "@/hooks/use-transfer";
import { Button } from "@ethereum-entity-registry/ui/components/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@ethereum-entity-registry/ui/components/alert";
import { Input } from "@ethereum-entity-registry/ui/components/input";
import { Label } from "@ethereum-entity-registry/ui/components/label";
import { getTokens, useENSGetAddress, ENS_DOMAIN } from "@ethereum-entity-registry/sdk";
import { SelectToken } from "@/components/select-token";

export function ERC20Transfer() {
  const chainId = useChainId();
  const tokens = getTokens(chainId);
  const [selectedToken, setSelectedToken] = useState<Address | undefined>(
    tokens[0]?.address,
  );
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("100");

  const { address } = useAccount();
  const { transferAsync, isPending } = useTransfer();
  const queryClient = useQueryClient();
  const { data: balance, queryKey } = useToken(selectedToken, address);

  // Determine if input is an ENS name (ends with .${ENS_DOMAIN} or similar)
  const isEnsName = useMemo(() => {
    return recipient.includes(".") && !isAddress(recipient);
  }, [recipient]);

  // Resolve ENS name to address
  const { data: resolvedAddress, isLoading: isResolvingEns } = useENSGetAddress(
    recipient,
    { enabled: isEnsName },
  );

  // Final recipient address
  const finalRecipient = useMemo((): Address | null => {
    if (isAddress(recipient)) {
      return recipient as Address;
    }
    if (isEnsName && resolvedAddress) {
      return resolvedAddress;
    }
    return null;
  }, [recipient, isEnsName, resolvedAddress]);

  const tokenConfig = selectedToken
    ? tokens.find((t) => t.address === selectedToken)
    : undefined;

  const handleTransfer = async () => {
    if (!address || !selectedToken || !tokenConfig || !finalRecipient) return;

    await transferAsync({
      token: selectedToken,
      to: finalRecipient,
      amount: parseUnits(amount, tokenConfig.decimals),
    }).then(() => queryClient.invalidateQueries({ queryKey }));
  };

  const isValidRecipient = finalRecipient !== null;
  const showResolvedAddress = isEnsName && resolvedAddress;

  if (tokens.length === 0) return null;

  return (
    <Alert>
      <AlertTitle>Transfer ERC20 tokens</AlertTitle>
      <AlertDescription>
        <div className="mt-3 flex flex-col space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="recipient" className="text-xs">
                Recipient (address or ENS name)
              </Label>
              <Input
                id="recipient"
                placeholder={`0x... or name.${ENS_DOMAIN}`}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              {isResolvingEns && (
                <p className="text-xs text-muted-foreground mt-1">
                  Resolving ENS name...
                </p>
              )}
              {showResolvedAddress && (
                <p className="text-xs text-muted-foreground mt-1">
                  Resolved: {resolvedAddress}
                </p>
              )}
              {isEnsName &&
                !isResolvingEns &&
                !resolvedAddress &&
                recipient && (
                  <p className="text-xs text-destructive mt-1">
                    ENS name not found
                  </p>
                )}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="w-32">
              <Label htmlFor="amount" className="text-xs">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                className="w-32"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <SelectToken
              value={selectedToken}
              onValueChange={setSelectedToken}
              tokens={tokens}
              placeholder="Select token"
            />
            <Button
              isLoading={isPending}
              variant="outline"
              onClick={handleTransfer}
              disabled={!selectedToken || !isValidRecipient || !amount}
            >
              Transfer
            </Button>
          </div>

          {selectedToken && (
            <p className="text-xs text-muted-foreground">
              Balance: {balance?.formatted ?? "0"} {balance?.symbol}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
