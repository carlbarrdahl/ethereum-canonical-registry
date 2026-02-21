"use client";

import { type Address } from "viem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { TokenSymbol } from "@/components/token-amount";

export interface TokenOption {
  address: Address;
  symbol?: string;
}

interface SelectTokenProps {
  value: Address | undefined;
  onValueChange: (value: Address) => void;
  tokens: TokenOption[];
  placeholder?: string;
}

export function SelectToken({
  value,
  onValueChange,
  tokens,
  placeholder = "Select a token",
}: SelectTokenProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as Address)}
    >
      <SelectTrigger className="min-w-24 w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {tokens.map((token) => (
          <SelectItem key={token.address} value={token.address}>
            {token.symbol ?? <TokenSymbol token={token.address} />}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
