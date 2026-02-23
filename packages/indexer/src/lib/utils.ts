import { config as sdkConfig, type SupportedChainId } from "@ethereum-canonical-registry/sdk";

const PRECISION = 18n; // Number of decimal places for fixed-point arithmetic
const SCALE = 10n ** PRECISION; // Scaling factor for fixed-point numbers

// Helper to get SplitsWarehouse address for a chain
// Uses SDK config which handles local (deployed) vs production (existing) addresses
export function getWarehouseAddress(chainId: number): string | undefined {
  const warehouse = sdkConfig[chainId as SupportedChainId]?.warehouse;
  return warehouse?.toLowerCase();
}

export function toAmountInUSD(amount: bigint, decimals: number, tokenPrice: string) {
  // Convert token price to scaled integer (18 decimal places)
  const tokenPriceFloat = parseFloat(tokenPrice);
  const tokenPriceScaled = BigInt(Math.floor(tokenPriceFloat * Number(SCALE)));
  const tokenScale = 10n ** BigInt(decimals);

  // amountInUSD = (amount / 10^decimals) * tokenPrice * 10^18
  // Simplified to avoid precision loss: (amount * tokenPriceScaled) / tokenScale
  return (amount * tokenPriceScaled) / tokenScale;
}
