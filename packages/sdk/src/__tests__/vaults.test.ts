import { describe, it, expect } from "vitest";
import { getVaults, getVaultByAddress, getVaultAddresses } from "../vaults";

describe("getVaults", () => {
  it("returns vaults for supported chains", () => {
    const vaults31337 = getVaults(31337);
    const vaultsSepolia = getVaults(11155111);

    expect(Array.isArray(vaults31337)).toBe(true);
    expect(Array.isArray(vaultsSepolia)).toBe(true);
  });

  it("returns empty for unsupported chains", () => {
    const vaults = getVaults(999999);
    expect(vaults).toEqual([]);
  });

  it("each vault has required fields", () => {
    const vaults = getVaults(31337);
    vaults.forEach((vault) => {
      expect(vault).toHaveProperty("address");
      expect(vault).toHaveProperty("name");
      expect(vault).toHaveProperty("symbol");
      expect(vault).toHaveProperty("asset");
      expect(typeof vault.address).toBe("string");
      expect(typeof vault.name).toBe("string");
      expect(typeof vault.symbol).toBe("string");
      expect(typeof vault.asset).toBe("string");
      expect(vault.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(vault.asset).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  it("mainnet returns empty array", () => {
    const vaults = getVaults(1);
    expect(vaults).toEqual([]);
  });
});

describe("getVaultByAddress", () => {
  it("finds vault by address (case-insensitive)", () => {
    const vaults = getVaults(31337);
    if (vaults.length > 0) {
      const firstVault = vaults[0];
      const foundExact = getVaultByAddress(31337, firstVault.address);
      const foundLower = getVaultByAddress(
        31337,
        firstVault.address.toLowerCase(),
      );
      const foundUpper = getVaultByAddress(
        31337,
        firstVault.address.toUpperCase(),
      );

      expect(foundExact).toEqual(firstVault);
      expect(foundLower).toEqual(firstVault);
      expect(foundUpper).toEqual(firstVault);
    }
  });

  it("returns undefined for unknown vault", () => {
    const vault = getVaultByAddress(
      31337,
      "0x0000000000000000000000000000000000000001",
    );
    expect(vault).toBeUndefined();
  });

  it("returns undefined for wrong chain", () => {
    const vaults = getVaults(31337);
    if (vaults.length > 0) {
      const vault = getVaultByAddress(999999, vaults[0].address);
      expect(vault).toBeUndefined();
    }
  });
});

describe("getVaultAddresses", () => {
  it("returns array of addresses", () => {
    const addresses = getVaultAddresses(31337);
    expect(Array.isArray(addresses)).toBe(true);
  });

  it("all addresses are valid hex strings", () => {
    const addresses = getVaultAddresses(31337);
    addresses.forEach((address) => {
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  it("returns empty array for unsupported chain", () => {
    const addresses = getVaultAddresses(999999);
    expect(addresses).toEqual([]);
  });

  it("returns empty array for mainnet", () => {
    const addresses = getVaultAddresses(1);
    expect(addresses).toEqual([]);
  });
});
