import { describe, it, expect } from "vitest";
import { config, ENS_DOMAIN } from "../config";
import { mainnet, sepolia, hardhat } from "viem/chains";

describe("config structure", () => {
  it("each chain config has expected shape", () => {
    const chains = [1, 11155111, 31337] as const;

    chains.forEach((chainId) => {
      const chainConfig = config[chainId];
      expect(chainConfig).toBeDefined();
      expect(typeof chainConfig).toBe("object");

      if (chainConfig.factory) {
        expect(chainConfig.factory).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
      if (chainConfig.warehouse) {
        expect(chainConfig.warehouse).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
      if (chainConfig.indexer) {
        expect(typeof chainConfig.indexer).toBe("string");
        expect(chainConfig.indexer.length).toBeGreaterThan(0);
      }
    });
  });

  it("mainnet config exists", () => {
    expect(config[1]).toBeDefined();
    expect(config[1].warehouse).toBeDefined();
  });

  it("sepolia config exists", () => {
    expect(config[11155111]).toBeDefined();
    expect(config[11155111].factory).toBeDefined();
    expect(config[11155111].warehouse).toBeDefined();
  });

  it("hardhat config exists", () => {
    expect(config[31337]).toBeDefined();
    expect(config[31337].factory).toBeDefined();
    expect(config[31337].warehouse).toBeDefined();
  });
});

describe("ENS_DOMAIN", () => {
  it("is defined and is a string", () => {
    expect(typeof ENS_DOMAIN).toBe("string");
    expect(ENS_DOMAIN.length).toBeGreaterThan(0);
  });

  it("contains .eth", () => {
    expect(ENS_DOMAIN).toContain(".eth");
  });
});

describe("chain constants", () => {
  it("viem chain objects are importable", () => {
    expect(mainnet.id).toBe(1);
    expect(sepolia.id).toBe(11155111);
    expect(hardhat.id).toBe(31337);
  });
});
