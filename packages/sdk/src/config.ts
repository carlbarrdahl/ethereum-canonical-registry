import { mainnet, sepolia, hardhat } from "viem/chains";
import _deployments from "@ethereum-entity-registry/contracts/deployments.json";

const deployments = _deployments as unknown as Record<string, Record<string, { address: string }>>;

// Mainnet (1), Sepolia (11155111), Local (31337)
export type SupportedChainId = 1 | 11155111 | 31337;

export type ChainConfig = {
  registry?: `0x${string}`;
  indexer?: string;
};

export const config: Record<SupportedChainId, ChainConfig> = {
  [mainnet.id]: {
    indexer: "http://localhost:42069/graphql",
  },
  [sepolia.id]: {
    registry: deployments["11155111"]?.EntityRegistry
      ?.address as `0x${string}`,
    indexer: "https://canonical-registry-production.up.railway.app/graphql",
  },
  [hardhat.id]: {
    registry: deployments[31337]?.EntityRegistry?.address as `0x${string}`,
    indexer: "http://localhost:42069/graphql",
  },
};
