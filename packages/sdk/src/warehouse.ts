import {
  type Abi,
  type Address,
  type WalletClient,
  type PublicClient,
  getContract,
} from "viem";
import { writeAndWait } from "./lib/tx";
import { type SupportedChainId, config } from "./config";

type ChainDeployments = {
  SplitsWarehouse: { abi: unknown };
};

export function createWarehouseMethods(
  wallet: WalletClient | undefined,
  publicClient: PublicClient,
  chainId: SupportedChainId,
  deployments: ChainDeployments,
) {
  return {
    /**
     * Withdraw tokens from the SplitsWarehouse
     * @param owner Address to withdraw for (usually msg.sender)
     * @param token Token address to withdraw
     */
    withdraw: async (
      owner: Address,
      token: Address,
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const warehouseAddress = config[chainId]?.warehouse;
      if (!warehouseAddress)
        throw new Error("SplitsWarehouse not deployed on this network");

      const contract = getContract({
        address: warehouseAddress,
        abi: deployments.SplitsWarehouse.abi as Abi,
        client: { public: publicClient, wallet },
      });

      const hash = await (contract as any).write.withdraw([owner, token], {
        account: wallet.account!,
      });

      return writeAndWait(wallet, hash);
    },

    /**
     * Get warehouse balance for a user/token
     * @param owner Address to check balance for
     * @param token Token address
     */
    balanceOf: async (owner: Address, token: Address): Promise<bigint> => {
      const warehouseAddress = config[chainId]?.warehouse;
      if (!warehouseAddress)
        throw new Error("SplitsWarehouse not deployed on this network");

      const contract = getContract({
        address: warehouseAddress,
        abi: deployments.SplitsWarehouse.abi as Abi,
        client: { public: publicClient },
      });

      // ERC6909 balanceOf(owner, tokenId)
      // tokenId = uint256(uint160(tokenAddress))
      const tokenId = BigInt(token);
      return (contract as any).read.balanceOf([owner, tokenId]);
    },
  };
}
