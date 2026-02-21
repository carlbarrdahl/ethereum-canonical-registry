import { formatUnits } from "viem";
import { formatNumber, formatMoney } from "../lib/format";
import { cn } from "@workspace/ui/lib/utils";

export const Amount = ({
  amount,
  decimals = 18,
  symbol,
  className,
  hideSymbol = false,
}: {
  amount?: bigint | string;
  decimals?: number;
  symbol?: string;
  className?: string;
  hideSymbol?: boolean;
}) => {
  if (!amount) return <>--</>;
  const formattedAmount = formatNumber(
    parseFloat(formatUnits(BigInt(amount), decimals)),
  );
  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span>{formattedAmount}</span>
      {!hideSymbol && symbol && <span className="text-[10px]">{symbol}</span>}
    </span>
  );
};

// USD amounts from the indexer are stored with 18 decimal places
const USD_DECIMALS = 18;

export const USDAmount = ({
  amount,
  className,
  compact = false,
}: {
  amount?: bigint | string;
  className?: string;
  compact?: boolean;
}) => {
  if (!amount || amount === "0" || amount === 0n) return <>$0</>;

  const value = parseFloat(formatUnits(BigInt(amount), USD_DECIMALS));

  if (compact) {
    // Use compact notation for large numbers
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
    return <span className={className}>{formatted}</span>;
  }

  return <span className={className}>{formatMoney(value, "USD")}</span>;
};
