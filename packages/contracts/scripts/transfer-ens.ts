import { createPublicClient, createWalletClient, http, namehash } from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import deployments from "../deployments.json";

const CHAIN_ID = "31337";
// Hardhat's default account #0
const DEPLOYER_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const ENS_DOMAIN = "support-dev.eth";

async function main() {
  // Get recipient address from command line args
  const recipientAddress = process.argv[2];

  if (!recipientAddress) {
    console.error("❌ Error: Please provide a recipient address");
    console.log("\nUsage:");
    console.log(
      "  npx tsx scripts/transfer-ens.ts <recipient-address> [ens-name]",
    );
    console.log("\nExample:");
    console.log(
      "  npx tsx scripts/transfer-ens.ts 0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    );
    console.log(
      "  npx tsx scripts/transfer-ens.ts 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 one.support-dev.eth",
    );
    process.exit(1);
  }

  // Optional: Allow specifying which ENS name to transfer (defaults to support-dev.eth)
  const ensName = process.argv[3] || ENS_DOMAIN;

  console.log(`\n=== Transferring ${ensName} ===`);
  console.log("================================\n");

  const contracts = (
    deployments as Record<
      string,
      Record<string, { address: string; abi: unknown[] }>
    >
  )[CHAIN_ID];

  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });

  const account = privateKeyToAccount(DEPLOYER_KEY);
  const walletClient = createWalletClient({
    account,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });

  const nameWrapper = {
    address: contracts.NameWrapper.address as `0x${string}`,
    abi: contracts.NameWrapper.abi,
  };

  const node = namehash(ensName);

  // Check current owner
  console.log(`1. Checking current owner of ${ensName}...`);
  const [currentOwner] = (await publicClient.readContract({
    ...nameWrapper,
    functionName: "getData",
    args: [BigInt(node)],
  })) as [string, number, bigint];

  console.log(`   Current owner: ${currentOwner}`);
  console.log(`   Your address:  ${account.address}`);

  if (currentOwner.toLowerCase() !== account.address.toLowerCase()) {
    console.error(
      `\n❌ Error: You don't own ${ensName}. Current owner is ${currentOwner}`,
    );
    process.exit(1);
  }

  // Validate recipient address
  if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
    console.error(`\n❌ Error: Invalid Ethereum address: ${recipientAddress}`);
    process.exit(1);
  }

  // Transfer the name
  console.log(`\n2. Transferring ${ensName} to ${recipientAddress}...`);
  const hash = await walletClient.writeContract({
    ...nameWrapper,
    functionName: "safeTransferFrom",
    args: [
      account.address,
      recipientAddress as `0x${string}`,
      BigInt(node),
      1n, // amount (ERC1155 - always 1 for ENS names)
      "0x" as `0x${string}`, // data
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`   ✅ Transfer successful! tx: ${receipt.transactionHash}`);

  // Verify new owner
  console.log(`\n3. Verifying new owner...`);
  const [newOwner] = (await publicClient.readContract({
    ...nameWrapper,
    functionName: "getData",
    args: [BigInt(node)],
  })) as [string, number, bigint];

  console.log(`   New owner: ${newOwner}`);

  if (newOwner.toLowerCase() === recipientAddress.toLowerCase()) {
    console.log(`   ✅ Transfer confirmed!`);
  } else {
    console.log(
      `   ⚠️  Warning: Owner mismatch. Expected ${recipientAddress}, got ${newOwner}`,
    );
  }

  console.log("\n=== Transfer Complete ===\n");
}

main().catch(console.error);
