import {
  type Abi,
  type Address,
  type WalletClient,
  type PublicClient,
  getContract,
} from "viem";
import { writeAndWait } from "./lib/tx";

type ChainDeployments = {
  ClaimableEscrow: { abi: unknown };
};

export function createEscrowMethods(
  wallet: WalletClient | undefined,
  publicClient: PublicClient,
  deployments: ChainDeployments,
) {
  const escrowAbi = deployments.ClaimableEscrow.abi as Abi;

  return {
    /**
     * Withdraw all funds for a given token from an escrow proxy to its registered owner.
     * Anyone may call — funds always go to the registered owner in the registry.
     */
    withdrawTo: async (
      escrowAddress: Address,
      token: Address,
    ): Promise<{ hash: `0x${string}` }> => {
      if (!wallet) throw new Error("Wallet required");
      const contract = getContract({
        address: escrowAddress,
        abi: escrowAbi,
        client: { public: publicClient, wallet },
      });
      const hash = await (contract as any).write.withdrawTo([token], {
        account: wallet.account!,
      });
      return writeAndWait(wallet, hash);
    },
  };
}
