import { cachedFetchWithRetry } from "./fetch";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

// Threshold in seconds to determine if an event is "recent"
// Events within this threshold use current price API instead of historical
const RECENT_EVENT_THRESHOLD_SECONDS = 300; // 5 minutes

// Common stablecoins that should be rounded to $1 when close to peg
const STABLECOINS = new Set([
  "USDC",
  "USDT",
  "DAI",
  "USDE",
  "FRAX",
  "BUSD",
  "TUSD",
  "GUSD",
  "USDP",
  "LUSD",
  "SUSD",
  "USDD",
  "FDUSD",
  "PYUSD",
]);

function normalizeStablecoinPrice(symbol: string, price: string): string {
  // If it's a stablecoin and the price is within 2% of $1, round to $1
  if (STABLECOINS.has(symbol.toUpperCase())) {
    const priceNum = parseFloat(price);
    if (priceNum > 0 && priceNum >= 0.98 && priceNum <= 1.02) {
      return "1";
    }
  }
  return price;
}

export async function fetchTokenPrice(symbol: string, timestamp: bigint) {
  // Convert timestamp to seconds (blockchain timestamps are in seconds since epoch, UTC)
  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageInSeconds = nowSeconds - timestampSeconds;

  // Fallback price for stablecoins if API fails
  const stablecoinFallback = STABLECOINS.has(symbol.toUpperCase()) ? "1" : "0";

  // If the event is very recent OR timestamp is in the future (testnet issue),
  // Alchemy might not have historical data yet. Fall back to current price API.
  if (ageInSeconds < RECENT_EVENT_THRESHOLD_SECONDS || timestampSeconds > nowSeconds) {
    return cachedFetchWithRetry<{
      data: { prices: { value: string }[] }[];
    }>(
      `https://api.g.alchemy.com/prices/v1/${ALCHEMY_API_KEY}/tokens/by-symbol?symbols=${symbol.toLowerCase()}`,
      { headers: { accept: "application/json" } },
    )
      .then((r) => {
        const price = String(r.data?.[0]?.prices[0]?.value ?? 0);
        const normalizedPrice = normalizeStablecoinPrice(symbol, price);

        // If API returned 0 or invalid price, use stablecoin fallback
        return normalizedPrice === "0" ? stablecoinFallback : normalizedPrice;
      })
      .catch((err) => {
        return stablecoinFallback;
      });
  }

  // For older events, use historical price API
  return cachedFetchWithRetry<{
    symbol: string;
    currency: string;
    data: { value: string; timestamp: string }[];
  }>(
    `https://api.g.alchemy.com/prices/v1/${ALCHEMY_API_KEY}/tokens/historical`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: symbol.toUpperCase(),
        startTime: timestampSeconds - 300,
        endTime: timestampSeconds + 300,
        interval: "1h",
      }),
    },
  )
    .then((r) => {
      const price = r.data?.[0]?.value ?? "0";
      const normalizedPrice = normalizeStablecoinPrice(symbol, price);
      // If historical API returned 0 or invalid price, use stablecoin fallback
      return normalizedPrice === "0"
        ? stablecoinFallback
        : String(normalizedPrice);
    })
    .catch((err) => {
      return stablecoinFallback;
    });
}
