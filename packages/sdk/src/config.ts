import { mainnet, sepolia, base, baseSepolia, hardhat } from "viem/chains";
import _deployments from "@ethereum-entity-registry/contracts/deployments.json";

const deployments = _deployments as unknown as Record<string, Record<string, { address: string }>>;

// Mainnet (1), Sepolia (11155111), Base (8453), Base Sepolia (84532), Local (31337)
export type SupportedChainId = 1 | 11155111 | 8453 | 84532 | 31337;

export type ChainConfig = {
  registry?: `0x${string}`;
  indexer?: string;
};

export const config: Record<SupportedChainId, ChainConfig> = {
  [mainnet.id]: {
    indexer: "http://localhost:42069/graphql",
  },
  [sepolia.id]: {
    registry: (deployments["11155111"]?.EntityRegistry ?? deployments["11155111"]?.CanonicalRegistry)
      ?.address as `0x${string}`,
    indexer: "https://canonical-registry-production.up.railway.app/graphql",
  },
  [base.id]: {
    indexer: "http://localhost:42069/graphql",
  },
  [baseSepolia.id]: {
    registry: deployments["84532"]?.EntityRegistry?.address as `0x${string}`,
    indexer: "http://localhost:42069/graphql",
  },
  [hardhat.id]: {
    registry: deployments[31337]?.EntityRegistry?.address as `0x${string}`,
    indexer: "http://localhost:42069/graphql",
  },
};
