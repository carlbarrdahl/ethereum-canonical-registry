import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../lib/fetch", () => ({
  cachedFetchWithRetry: vi.fn(),
}));

import { fetchTokenPrice } from "../lib/fetch-token-price";
import { cachedFetchWithRetry } from "../lib/fetch";

const mockFetch = cachedFetchWithRetry as any;

// A timestamp 1 hour in the past (older than the 5-minute recent threshold)
const OLD_TIMESTAMP = BigInt(Math.floor(Date.now() / 1000) - 3600);
// A timestamp 1 minute in the past (within the 5-minute recent threshold)
const RECENT_TIMESTAMP = BigInt(Math.floor(Date.now() / 1000) - 60);

describe("fetchTokenPrice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recent events (< 5 minutes old)", () => {
    it("uses current price API for recent timestamps", async () => {
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "3000" }] }],
      } as any);

      await fetchTokenPrice("ETH", RECENT_TIMESTAMP);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/tokens/by-symbol"),
        expect.any(Object),
      );
    });

    it("uses current price API for future timestamps (testnet)", async () => {
      const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 3600);
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "3000" }] }],
      } as any);

      await fetchTokenPrice("ETH", futureTimestamp);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/tokens/by-symbol"),
        expect.any(Object),
      );
    });

    it("returns the price from current price API", async () => {
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "2500.50" }] }],
      } as any);

      const price = await fetchTokenPrice("ETH", RECENT_TIMESTAMP);

      expect(price).toBe("2500.50");
    });
  });

  describe("old events (> 5 minutes old)", () => {
    it("uses historical price API for old timestamps", async () => {
      mockFetch.mockResolvedValue({
        symbol: "ETH",
        currency: "USD",
        data: [{ value: "2800", timestamp: "2024-01-01T00:00:00Z" }],
      } as any);

      await fetchTokenPrice("ETH", OLD_TIMESTAMP);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/tokens/historical"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("returns the price from historical price API", async () => {
      mockFetch.mockResolvedValue({
        data: [{ value: "2800" }],
      } as any);

      const price = await fetchTokenPrice("ETH", OLD_TIMESTAMP);

      expect(price).toBe("2800");
    });
  });

  describe("stablecoin normalization", () => {
    it("rounds USDC to $1 when price is within 2% of peg", async () => {
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "1.001" }] }],
      } as any);

      const price = await fetchTokenPrice("USDC", RECENT_TIMESTAMP);

      expect(price).toBe("1");
    });

    it("rounds USDT to $1 when price is within 2% (low)", async () => {
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "0.99" }] }],
      } as any);

      const price = await fetchTokenPrice("USDT", RECENT_TIMESTAMP);

      expect(price).toBe("1");
    });

    it("preserves price when stablecoin is depegged (outside 2%)", async () => {
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "0.90" }] }],
      } as any);

      const price = await fetchTokenPrice("USDC", RECENT_TIMESTAMP);

      expect(price).toBe("0.90");
    });

    it("does not normalize non-stablecoin prices", async () => {
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "1.01" }] }],
      } as any);

      const price = await fetchTokenPrice("ETH", RECENT_TIMESTAMP);

      expect(price).toBe("1.01");
    });
  });

  describe("fallback behavior", () => {
    it("returns '1' for stablecoin when API fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const price = await fetchTokenPrice("USDC", RECENT_TIMESTAMP);

      expect(price).toBe("1");
    });

    it("returns '0' for non-stablecoin when API fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const price = await fetchTokenPrice("ETH", RECENT_TIMESTAMP);

      expect(price).toBe("0");
    });

    it("returns stablecoin fallback when API returns zero price", async () => {
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "0" }] }],
      } as any);

      const price = await fetchTokenPrice("DAI", RECENT_TIMESTAMP);

      expect(price).toBe("1");
    });

    it("returns '0' for non-stablecoin when API returns zero price", async () => {
      mockFetch.mockResolvedValue({
        data: [{ prices: [{ value: "0" }] }],
      } as any);

      const price = await fetchTokenPrice("ETH", RECENT_TIMESTAMP);

      expect(price).toBe("0");
    });
  });
});
