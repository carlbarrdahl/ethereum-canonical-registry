import { Address, formatUnits } from "viem";
import { useToken } from "@/hooks/use-token";
import { formatNumber } from "../lib/format";

// Re-export shared Amount component
export { Amount } from "./amount";

export function TokenAmount({
  amount,
  token,
  hideSymbol = false,
  decimals = 2,
}: {
  amount?: number | bigint | string;
  token: Address;
  hideSymbol?: boolean;
  decimals?: number;
}) {
  const { data } = useToken(token);
  if (!data || amount === undefined) return null;
  const formattedAmount = formatNumber(
    +Number(formatUnits(BigInt(amount), data?.decimals ?? 18)).toFixed(
      decimals,
    ),
  );
  return <>{`${formattedAmount} ${hideSymbol ? "" : data.symbol}`}</>;
}

export function TokenSymbol({ token }: { token: Address }) {
  const { data } = useToken(token);
  if (!data) return null;

  return <>{data.symbol}</>;
}
