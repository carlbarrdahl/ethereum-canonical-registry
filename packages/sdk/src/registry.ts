import {
  type Abi,
  type Address,
  type WalletClient,
  type PublicClient,
  getContract,
} from "viem";
import { writeAndWait } from "./lib/tx";

type ChainDeployments = {
  CanonicalRegistry: { address: string; abi: unknown };
};

export function createRegistryMethods(
  wallet: WalletClient | undefined,
  publicClient: PublicClient,
  deployments: ChainDeployments,
) {
  const registryAddress = deployments.CanonicalRegistry.address as Address;
  const registryAbi = deployments.CanonicalRegistry.abi as Abi;

  function getRegistryContract() {
    return getContract({
      address: registryAddress,
      abi: registryAbi,
      client: { public: publicClient, wallet: wallet! },
    });
  }

  return {
    /**
     * Compute the bytes32 id for a (namespace, canonicalString) pair.
     */
    toId: async (
      namespace: string,
      canonicalString: string,
    ): Promise<`0x${string}`> => {
      const contract = getContract({
        address: registryAddress,
        abi: registryAbi,
        client: { public: publicClient },
      });
      return (contract as any).read.toId([namespace, canonicalString]);
    },

    /**
     * Get the registered owner of an identifier (resolves through aliases).
     */
    ownerOf: async (id: `0x${string}`): Promise<Address> => {
      const contract = getContract({
        address: registryAddress,
        abi: registryAbi,
        client: { public: publicClient },
      });
      return (contract as any).read.ownerOf([id]);
    },

    /**
     * Get the deterministic escrow address for an identifier.
     */
    predictAddress: async (id: `0x${string}`): Promise<Address> => {
      const contract = getContract({
        address: registryAddress,
        abi: registryAbi,
        client: { public: publicClient },
      });
      return (contract as any).read.predictAddress([id]);
    },

    /**
     * Claim ownership of an identifier with an oracle proof.
     */
    claim: async (
      namespace: string,
      canonicalString: string,
      proof: `0x${string}`,
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const contract = getRegistryContract();
      const hash = await (contract as any).write.claim(
        [namespace, canonicalString, proof],
        { account: wallet.account! },
      );
      return writeAndWait(wallet, hash);
    },

    /**
     * Revoke ownership of an identifier.
     */
    revoke: async (
      namespace: string,
      canonicalString: string,
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const contract = getRegistryContract();
      const hash = await (contract as any).write.revoke(
        [namespace, canonicalString],
        { account: wallet.account! },
      );
      return writeAndWait(wallet, hash);
    },

    /**
     * Link alias identifiers to a primary identifier.
     */
    linkIds: async (
      primaryId: `0x${string}`,
      aliasIds: `0x${string}`[],
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const contract = getRegistryContract();
      const hash = await (contract as any).write.linkIds(
        [primaryId, aliasIds],
        { account: wallet.account! },
      );
      return writeAndWait(wallet, hash);
    },

    /**
     * Unlink alias identifiers from their primary.
     */
    unlinkIds: async (
      primaryId: `0x${string}`,
      aliasIds: `0x${string}`[],
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const contract = getRegistryContract();
      const hash = await (contract as any).write.unlinkIds(
        [primaryId, aliasIds],
        { account: wallet.account! },
      );
      return writeAndWait(wallet, hash);
    },

    /**
     * Deploy the ClaimableEscrow proxy for an identifier (permissionless).
     */
    deployEscrow: async (
      id: `0x${string}`,
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const contract = getRegistryContract();
      const hash = await (contract as any).write.deployEscrow([id], {
        account: wallet.account!,
      });
      return writeAndWait(wallet, hash);
    },

    /**
     * Admin: set or replace the verifier for a namespace.
     */
    setVerifier: async (
      namespace: string,
      verifier: Address,
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const contract = getRegistryContract();
      const hash = await (contract as any).write.setVerifier(
        [namespace, verifier],
        { account: wallet.account! },
      );
      return writeAndWait(wallet, hash);
    },
  };
}
