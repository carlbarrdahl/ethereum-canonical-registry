import {
  createPublicClient,
  createWalletClient,
  http,
  namehash,
} from "viem";
import { hardhat, sepolia, mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
import deployments from "../deployments.json";

config({ path: ".env" });
config();

// Parse network from command line args (e.g., --network sepolia)
const args = process.argv.slice(2);
const networkIndex = args.indexOf("--network");
const network = networkIndex !== -1 ? args[networkIndex + 1] : "hardhat";

// Network configurations
const NETWORK_CONFIG = {
  hardhat: {
    chainId: "31337",
    chain: hardhat,
    rpcUrl: "http://127.0.0.1:8545",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    ensDomain: "support-dev.eth",
  },
  sepolia: {
    chainId: "11155111",
    chain: sepolia,
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    privateKey: process.env.SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY,
    ensDomain: "support-dev.eth",
  },
  mainnet: {
    chainId: "1",
    chain: mainnet,
    rpcUrl: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
    privateKey: process.env.MAINNET_PRIVATE_KEY || process.env.PRIVATE_KEY,
    ensDomain: "support.eth", // Update this for mainnet
  },
};

/**
 * Post-deployment script to configure ENS on StrategyFactory.
 * Only needed when deploying ENS separately from the factory (e.g., Sepolia).
 * For local dev, Strategy.ts handles this via m.useModule(ENSModule).
 * 
 * Usage:
 *   bun run scripts/configure-factory-ens.ts --network sepolia
 *   bun run scripts/configure-factory-ens.ts --network mainnet
 *   bun run scripts/configure-factory-ens.ts (defaults to hardhat)
 */
async function main() {
  const config = NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG];
  if (!config) {
    console.error(
      `❌ Invalid network: ${network}. Use: hardhat, sepolia, or mainnet`,
    );
    process.exit(1);
  }

  if (!config.privateKey) {
    console.error(`❌ No private key found for ${network}`);
    console.error(
      `Set SEPOLIA_PRIVATE_KEY or MAINNET_PRIVATE_KEY in your .env file`,
    );
    process.exit(1);
  }

  console.log(`\n🌐 Network: ${network}`);
  console.log(`📍 Chain ID: ${config.chainId}`);
  console.log(`🔗 RPC: ${config.rpcUrl}`);
  console.log(`🏷️  ENS Domain: ${config.ensDomain}\n`);

  const contracts = (
    deployments as Record<
      string,
      Record<string, { address: string; abi: unknown[] }>
    >
  )[config.chainId];

  if (!contracts) {
    console.error(`❌ No deployments found for chain ID ${config.chainId}`);
    process.exit(1);
  }

  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  const account = privateKeyToAccount(config.privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  const factory = {
    address: contracts.StrategyFactory.address as `0x${string}`,
    abi: contracts.StrategyFactory.abi,
  };

  const nameWrapper = {
    address: contracts.NameWrapper.address as `0x${string}`,
    abi: contracts.NameWrapper.abi,
  };

  const parentNode = namehash(config.ensDomain);

  // Check if already configured
  const currentRegistrar = await publicClient.readContract({
    ...factory,
    functionName: "ensRegistrar",
  });

  if (currentRegistrar !== "0x0000000000000000000000000000000000000000") {
    console.log("✅ Factory ENS already configured");
    console.log(`   Registrar: ${currentRegistrar}`);
    return;
  }

  console.log("📋 Contract Addresses:");
  console.log(`   StrategyFactory: ${contracts.StrategyFactory.address}`);
  console.log(`   ForeverSubnameRegistrar: ${contracts.ForeverSubnameRegistrar.address}`);
  console.log(`   PublicResolver: ${contracts.PublicResolver.address}`);
  console.log(`   NameWrapper: ${contracts.NameWrapper.address}`);
  console.log(`   Parent Node: ${parentNode}\n`);

  // 1. Configure ENS on StrategyFactory
  console.log("⚙️  Configuring ENS on StrategyFactory...");
  const configHash = await walletClient.writeContract({
    ...factory,
    functionName: "configureENS",
    args: [
      contracts.ForeverSubnameRegistrar.address as `0x${string}`,
      contracts.PublicResolver.address as `0x${string}`,
      contracts.NameWrapper.address as `0x${string}`,
      parentNode,
      config.ensDomain,
    ],
  });
  console.log(`   Transaction: ${configHash}`);
  await publicClient.waitForTransactionReceipt({ hash: configHash });
  console.log("✅ Factory ENS configured");

  // 2. Approve StrategyFactory on NameWrapper (so it can receive/transfer wrapped names)
  console.log("\n⚙️  Approving factory on NameWrapper...");
  const approveHash = await walletClient.writeContract({
    ...nameWrapper,
    functionName: "setApprovalForAll",
    args: [contracts.StrategyFactory.address as `0x${string}`, true],
  });
  console.log(`   Transaction: ${approveHash}`);
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log("✅ Factory approved on NameWrapper");

  console.log("\n🎉 Done! Factory can now create strategies with ENS.");
}

main().catch(console.error);
