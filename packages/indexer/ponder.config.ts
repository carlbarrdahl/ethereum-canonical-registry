import {
  createConfig,
  factory,
  loadBalance,
  rateLimit,
  type ChainConfig,
} from "ponder";
import { type Abi, parseAbiItem } from "viem";
import { hardhat, sepolia, mainnet } from "viem/chains";
import { http } from "viem";

import deployments from "@ethereum-entity-registry/contracts/deployments.json";

const isDev = process.env.NODE_ENV === "development";

const activeChains = {
  ...(isDev ? { hardhat } : { sepolia }),
};

function getRpcTransport(chainId: number) {
  switch (chainId) {
    case hardhat.id:
      return http(process.env.PONDER_RPC_URL_31337 ?? "http://127.0.0.1:8545");

    case sepolia.id: {
      const providers = [];

      if (process.env.PONDER_RPC_URL_11155111) {
        providers.push(
          rateLimit(http(process.env.PONDER_RPC_URL_11155111), {
            requestsPerSecond: 10,
            browser: false,
          }),
        );
      }

      if (providers.length === 0) {
        providers.push(
          rateLimit(http("https://ethereum-sepolia-rpc.publicnode.com"), {
            requestsPerSecond: 1,
            browser: false,
          }),
          rateLimit(http("https://ethereum-sepolia-public.nodies.app"), {
            requestsPerSecond: 1,
            browser: false,
          }),
          rateLimit(http("https://eth-sepolia.api.onfinality.io/public"), {
            requestsPerSecond: 1,
            browser: false,
          }),
        );
      }

      return providers.length === 1 ? providers[0] : loadBalance(providers);
    }

    case mainnet.id: {
      const providers = [];

      if (process.env.PONDER_RPC_URL_1) {
        providers.push(
          rateLimit(http(process.env.PONDER_RPC_URL_1), {
            requestsPerSecond: 25,
            browser: false,
          }),
        );
      }

      providers.push(
        rateLimit(http("https://cloudflare-eth.com"), {
          requestsPerSecond: 10,
          browser: false,
        }),
        rateLimit(http("https://eth-mainnet.public.blastapi.io"), {
          requestsPerSecond: 10,
          browser: false,
        }),
      );

      return providers.length > 1 ? loadBalance(providers) : providers[0];
    }

    default:
      throw new Error(`No RPC configured for chain ${chainId}`);
  }
}

const chains: Record<string, ChainConfig> = Object.fromEntries(
  Object.entries(activeChains).map(([name, { id }]) => [
    name,
    { id, rpc: getRpcTransport(id) },
  ]),
);

function getDeployment(chainId: number, contractName: string) {
  const chainDeployments =
    deployments[String(chainId) as keyof typeof deployments];
  return chainDeployments?.[contractName as keyof typeof chainDeployments] as {
    address: `0x${string}`;
    abi: Abi;
    startBlock?: number;
  };
}

function forChains<T>(fn: (chainId: number) => T): Record<string, T> {
  return Object.fromEntries(
    Object.entries(chains).map(([name, { id }]) => [name, fn(id)]),
  );
}

export default createConfig({
  chains,
  contracts: {
    EntityRegistry: {
      abi: getDeployment(hardhat.id, "EntityRegistry").abi,
      chain: forChains((id) => {
        const d = getDeployment(id, "EntityRegistry");
        return { address: d?.address, startBlock: d?.startBlock ?? 0 };
      }),
    },
  },
});
