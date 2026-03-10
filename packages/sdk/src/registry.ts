import {
  type Abi,
  type Address,
  type WalletClient,
  type PublicClient,
  getContract,
  zeroAddress,
} from "viem";
import { writeAndWait } from "./lib/tx";
import { canonicalise, toId, resolveDepositAddress, parseAnyIdentifier } from "./utils";

export type IdentifierState = {
  id: `0x${string}`;
  depositAddress: Address;
  owner: Address | null;
  balance: bigint | null;
};

type ChainDeployments = {
  CanonicalRegistry: { address: string; abi: unknown };
  beaconProxyBytecode?: string;
};

export function createRegistryMethods(
  wallet: WalletClient | undefined,
  publicClient: PublicClient,
  deployments: ChainDeployments,
) {
  const registryAddress = deployments.CanonicalRegistry.address as Address;
  const beaconProxyBytecode = (deployments.beaconProxyBytecode ?? "") as `0x${string}`;
  const registryAbi = deployments.CanonicalRegistry.abi as Abi;

  function getRegistryContract() {
    return getContract({
      address: registryAddress,
      abi: registryAbi,
      client: { public: publicClient, wallet: wallet! },
    });
  }

  const erc20Abi = [
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const;

  async function resolveById(
    namespace: string,
    rawCanonicalString: string,
    token?: Address,
  ): Promise<IdentifierState> {
    const cs = canonicalise(rawCanonicalString);
    const id = toId(namespace, cs);

    const depositAddress: Address = beaconProxyBytecode
      ? resolveDepositAddress(id, registryAddress, beaconProxyBytecode)
      : await (getContract({
          address: registryAddress,
          abi: registryAbi,
          client: { public: publicClient },
        }) as any).read.predictAddress([id]);

    const registryContract = getContract({
      address: registryAddress,
      abi: registryAbi,
      client: { public: publicClient },
    });

    const [ownerRaw, balance] = await Promise.all([
      (registryContract as any).read.ownerOf([id]) as Promise<Address>,
      token
        ? publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [depositAddress],
          })
        : Promise.resolve(null),
    ]);

    return {
      id,
      depositAddress,
      owner: ownerRaw === zeroAddress ? null : ownerRaw,
      balance,
    };
  }

  return {
    /**
     * Get the registered owner of an identifier (resolves through aliases).
     * Returns null if unclaimed.
     */
    ownerOf: async (id: `0x${string}`): Promise<Address | null> => {
      const contract = getContract({
        address: registryAddress,
        abi: registryAbi,
        client: { public: publicClient },
      });
      const owner: Address = await (contract as any).read.ownerOf([id]);
      return owner === zeroAddress ? null : owner;
    },

    /**
     * Get the deterministic account address for an identifier.
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
     * Deploy the IdentityAccount proxy for an identifier (permissionless).
     */
    deployAccount: async (
      id: `0x${string}`,
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const contract = getRegistryContract();
      const hash = await (contract as any).write.deployAccount([id], {
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

    /**
     * Compute the deterministic identifier for a namespace + canonical string.
     */
    toId: (namespace: string, canonicalString: string): `0x${string}` => {
      return toId(namespace, canonicalString);
    },

    /**
     * Check whether the IdentityAccount for an identifier has been deployed.
     * Returns false if the deposit address has no code (not yet deployed).
     * The registry deploys it automatically during claim(), but funders can
     * send tokens before it's deployed — the address is always the same.
     */
    isAccountDeployed: async (id: `0x${string}`): Promise<boolean> => {
      const contract = getContract({
        address: registryAddress,
        abi: registryAbi,
        client: { public: publicClient },
      });
      const depositAddress: Address = await (contract as any).read.predictAddress([id]);
      const code = await publicClient.getBytecode({ address: depositAddress });
      return code !== undefined && code !== "0x";
    },

    /**
     * Resolve the full state of an identifier: owner, deposit address, and
     * ERC-20 balance — all in a single parallel batch of RPC calls.
     *
     * @example
     * const state = await sdk.registry.resolveIdentifier("github", "org/repo", tokenAddress)
     * // state.depositAddress — where funders should send tokens
     * // state.owner          — null if unclaimed
     * // state.balance        — claimable token balance at the deposit address
     */
    resolveIdentifier: (
      namespace: string,
      rawCanonicalString: string,
      token?: Address,
    ): Promise<IdentifierState> => resolveById(namespace, rawCanonicalString, token),

    /**
     * Resolve any free-form identifier string to its on-chain state.
     * Accepts namespace:value, URLs, and domain names.
     *
     * @example
     * sdk.registry.resolve("github:org/repo")
     * sdk.registry.resolve("github.com/org/repo")
     * sdk.registry.resolve("https://github.com/org/repo")
     * sdk.registry.resolve("dns:example.com")
     * sdk.registry.resolve("www.example.com")
     * sdk.registry.resolve("npm:package-name")
     * sdk.registry.resolve("npmjs.com/package/foo")
     */
    resolve: (input: string, token?: Address): Promise<IdentifierState> => {
      const { namespace, canonicalString } = parseAnyIdentifier(input);
      return resolveById(namespace, canonicalString, token);
    },
  };
}
