import { describe, it, expect } from "vitest";
import {
  isNativeToken,
  getTokens,
  getTokenByAddress,
  getTokenAddresses,
  NATIVE_TOKEN,
} from "../tokens";

describe("isNativeToken", () => {
  it("returns true for NATIVE_TOKEN address", () => {
    expect(isNativeToken(NATIVE_TOKEN)).toBe(true);
  });

  it("returns true for zero address", () => {
    expect(isNativeToken("0x0000000000000000000000000000000000000000")).toBe(
      true,
    );
  });

  it("returns false for a random ERC20 address", () => {
    expect(isNativeToken("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")).toBe(
      false,
    );
  });

  it("is case-insensitive", () => {
    expect(isNativeToken(NATIVE_TOKEN.toUpperCase())).toBe(true);
    expect(isNativeToken(NATIVE_TOKEN.toLowerCase())).toBe(true);
  });

  it("handles empty string", () => {
    expect(isNativeToken("")).toBe(false);
  });

  it("handles undefined input", () => {
    expect(isNativeToken(undefined)).toBe(false);
  });
});

describe("getTokens", () => {
  it("returns non-empty array for chain 31337", () => {
    const tokens = getTokens(31337);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("returns empty array for unsupported chain", () => {
    const tokens = getTokens(999999);
    expect(tokens).toEqual([]);
  });

  it("each token has required fields", () => {
    const tokens = getTokens(31337);
    tokens.forEach((token) => {
      expect(token).toHaveProperty("address");
      expect(token).toHaveProperty("symbol");
      expect(token).toHaveProperty("name");
      expect(token).toHaveProperty("decimals");
      expect(typeof token.address).toBe("string");
      expect(typeof token.symbol).toBe("string");
      expect(typeof token.name).toBe("string");
      expect(typeof token.decimals).toBe("number");
    });
  });

  it("includes ETH in every chain config", () => {
    const chains = [1, 11155111, 31337];
    chains.forEach((chainId) => {
      const tokens = getTokens(chainId);
      const ethToken = tokens.find((t) => t.symbol === "ETH");
      expect(ethToken).toBeDefined();
      expect(ethToken?.address).toBe(NATIVE_TOKEN);
    });
  });
});

describe("getTokenByAddress", () => {
  it("finds token by exact address", () => {
    const tokens = getTokens(31337);
    if (tokens.length > 0) {
      const firstToken = tokens[0];
      const found = getTokenByAddress(31337, firstToken.address);
      expect(found).toEqual(firstToken);
    }
  });

  it("is case-insensitive", () => {
    const token = getTokenByAddress(31337, NATIVE_TOKEN.toLowerCase());
    expect(token?.address).toBe(NATIVE_TOKEN);
  });

  it("returns undefined for unknown address", () => {
    const token = getTokenByAddress(
      31337,
      "0x0000000000000000000000000000000000000001",
    );
    expect(token).toBeUndefined();
  });

  it("returns undefined for wrong chain", () => {
    const token = getTokenByAddress(999999, NATIVE_TOKEN);
    expect(token).toBeUndefined();
  });
});

describe("getTokenAddresses", () => {
  it("returns array of addresses", () => {
    const addresses = getTokenAddresses(31337);
    expect(Array.isArray(addresses)).toBe(true);
    expect(addresses.length).toBeGreaterThan(0);
  });

  it("all addresses are valid hex strings", () => {
    const addresses = getTokenAddresses(31337);
    addresses.forEach((address) => {
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  it("returns empty array for unsupported chain", () => {
    const addresses = getTokenAddresses(999999);
    expect(addresses).toEqual([]);
  });
});
