import { describe, it, expect } from "vitest";
import { toAmountInUSD } from "../lib/utils";

// Internal USD representation uses 18 decimal places of precision.
// e.g. $3000 is stored as 3000n * 10n**18n

describe("toAmountInUSD", () => {
  it("converts 1 ETH at $3000 to $3000 (18 decimals)", () => {
    const oneEth = 10n ** 18n;
    const result = toAmountInUSD(oneEth, 18, "3000");
    expect(result).toBe(3000n * 10n ** 18n);
  });

  it("converts 100 USDC at $1 to $100 (6 decimals)", () => {
    const oneHundredUsdc = 100n * 10n ** 6n;
    const result = toAmountInUSD(oneHundredUsdc, 6, "1");
    expect(result).toBe(100n * 10n ** 18n);
  });

  it("returns 0 for zero amount", () => {
    const result = toAmountInUSD(0n, 18, "3000");
    expect(result).toBe(0n);
  });

  it("returns 0 for zero price", () => {
    const result = toAmountInUSD(10n ** 18n, 18, "0");
    expect(result).toBe(0n);
  });

  it("handles very large amounts without overflow", () => {
    const largeAmount = 10n ** 27n; // 1 billion ETH in wei
    const result = toAmountInUSD(largeAmount, 18, "3000");
    expect(result).toBe(3000n * 10n ** 27n);
  });

  it("handles fractional token prices", () => {
    // 1000 tokens at $0.50 = $500
    const amount = 1000n * 10n ** 18n;
    const result = toAmountInUSD(amount, 18, "0.5");
    expect(result).toBe(500n * 10n ** 18n);
  });

  it("handles tokens with 0 decimals", () => {
    // 5 tokens at $100 = $500
    const result = toAmountInUSD(5n, 0, "100");
    expect(result).toBe(500n * 10n ** 18n);
  });
});
