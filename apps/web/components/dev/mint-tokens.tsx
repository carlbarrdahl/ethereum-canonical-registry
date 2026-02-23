"use client";

import { useState } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { type Address, erc20Abi, getAddress, parseUnits } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useToken } from "@/hooks/use-token";
import { Button } from "@ethereum-canonical-registry/ui/components/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@ethereum-canonical-registry/ui/components/alert";
import { useWaitForEvent } from "@/hooks/use-wait-for-event";
import { getTokens, isNativeToken } from "@ethereum-canonical-registry/sdk";
import { SelectToken } from "@/components/select-token";

// Mint ABI for TestToken
const mintAbi = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function MintTokens() {
  const chainId = useChainId();
  const tokens = getTokens(chainId).filter((t) => !isNativeToken(t.address));
  const [selectedToken, setSelectedToken] = useState<Address | undefined>(
    tokens[0]?.address,
  );
  const { address } = useAccount();
  const waitForEvent = useWaitForEvent(erc20Abi);
  const { writeContractAsync, isPending } = useWriteContract();
  const queryClient = useQueryClient();
  const { data: balance, queryKey } = useToken(selectedToken, address);

  const tokenConfig = selectedToken
    ? tokens.find((t) => t.address === selectedToken)
    : undefined;

  const handleMint = async () => {
    if (!address || !selectedToken || !tokenConfig) return;
    await writeContractAsync({
      address: selectedToken,
      abi: mintAbi,
      functionName: "mint",
      args: [getAddress(address), parseUnits("1000", tokenConfig.decimals)],
    })
      .then((hash) => waitForEvent(hash, "Transfer"))
      .then(() => queryClient.invalidateQueries({ queryKey }));
  };

  if (tokens.length === 0) return null;
  return (
    <Alert>
      <AlertTitle>Mint test tokens</AlertTitle>
      <AlertDescription>
        You can mint test tokens to use for funding strategies.
        <div className="mt-3 flex items-center gap-2">
          <SelectToken
            value={selectedToken}
            onValueChange={setSelectedToken}
            tokens={tokens}
            placeholder="Select token"
          />
          <Button
            isLoading={isPending}
            variant="outline"
            onClick={handleMint}
            disabled={!selectedToken}
          >
            Mint
          </Button>
        </div>
        {selectedToken && (
          <p className="text-xs text-muted-foreground">
            Balance: {balance?.formatted ?? "0"} {balance?.symbol}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
