import {
  type Address,
  type WalletClient,
  type PublicClient,
  createPublicClient,
  http,
} from "viem";
import { mainnet, sepolia, hardhat } from "viem/chains";
import { createIndexer, type Indexer } from "./lib/indexer";
import { config, type SupportedChainId } from "./config";
import deployments from "@ethereum-canonical-registry/contracts/deployments.json";

import { createRegistryMethods } from "./registry";
import { createEscrowMethods } from "./escrow";
import { createWarehouseMethods } from "./warehouse";

export * from "./lib/tx";
export * from "./components/provider";
export * from "./hooks";
export * from "./lib/indexer";
export { config, type SupportedChainId } from "./config";
export * from "./tokens";
export * from "./utils";
export type { IdentifierState } from "./registry";

type ChainDeployments = (typeof deployments)["31337"];

function getDeployments(chainId: SupportedChainId): ChainDeployments {
  const d = deployments[chainId.toString() as keyof typeof deployments];
  if (!d) throw new Error(`Chain ${chainId} not supported`);
  return d as ChainDeployments;
}

function getChain(chainId: SupportedChainId) {
  switch (chainId) {
    case 1:
      return mainnet;
    case 11155111:
      return sepolia;
    case 31337:
      return hardhat;
    default:
      return hardhat;
  }
}

export class CanonicalRegistrySDK {
  #wallet: WalletClient | undefined;
  #public: PublicClient;
  #chainId: SupportedChainId;
  #deployments: ChainDeployments;
  #indexer: Indexer;

  registry!: ReturnType<typeof createRegistryMethods>;
  escrow!: ReturnType<typeof createEscrowMethods>;
  warehouse!: ReturnType<typeof createWarehouseMethods>;

  constructor(wallet?: WalletClient, defaultChain?: SupportedChainId) {
    const chainId = (wallet?.chain?.id ??
      defaultChain ??
      31337) as SupportedChainId;
    const chain = getChain(chainId);

    this.#wallet = wallet;
    this.#chainId = chainId;
    this.#indexer = createIndexer(chainId);
    this.#public = createPublicClient({
      chain,
      transport: http(),
    });
    this.#deployments = getDeployments(chainId);

    this.registry = createRegistryMethods(
      wallet,
      this.#public,
      {
        ...this.#deployments,
        beaconProxyBytecode: deployments.beaconProxyBytecode,
      },
    );
    this.escrow = createEscrowMethods(wallet, this.#public, this.#deployments);
    this.warehouse = createWarehouseMethods(
      wallet,
      this.#public,
      chainId,
      this.#deployments,
    );
  }

  get wallet(): WalletClient | undefined {
    return this.#wallet;
  }

  get publicClient(): PublicClient {
    return this.#public;
  }

  get chainId(): SupportedChainId {
    return this.#chainId;
  }

  get indexer(): Indexer | null {
    return this.#indexer;
  }
}
