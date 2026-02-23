import { mainnet, sepolia, hardhat } from "viem/chains";
import _deployments from "@ethereum-canonical-registry/contracts/deployments.json";

const deployments = _deployments as unknown as Record<string, Record<string, { address: string }>>;

// Mainnet (1), Sepolia (11155111), Local (31337)
export type SupportedChainId = 1 | 11155111 | 31337;

export type ChainConfig = {
  registry?: `0x${string}`;
  warehouse?: `0x${string}`;
  indexer?: string;
};

export const config: Record<SupportedChainId, ChainConfig> = {
  [mainnet.id]: {
    warehouse: "0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8",
    indexer: "http://localhost:42069/graphql",
  },
  [sepolia.id]: {
    registry: deployments["11155111"]?.CanonicalRegistry
      ?.address as `0x${string}`,
    warehouse: deployments["11155111"]?.SplitsWarehouse
      ?.address as `0x${string}`,
    indexer: "https://canonical-registry-production.up.railway.app/graphql",
  },
  [hardhat.id]: {
    registry: deployments[31337]?.CanonicalRegistry?.address as `0x${string}`,
    warehouse: deployments[31337]?.SplitsWarehouse?.address as `0x${string}`,
    indexer: "http://localhost:42069/graphql",
  },
};
