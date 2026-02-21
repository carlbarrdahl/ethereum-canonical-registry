import {
  createPublicClient,
  createWalletClient,
  http,
  namehash,
} from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import deployments from "../deployments.json";

const CHAIN_ID = "31337";
// Hardhat's default account #0
const DEPLOYER_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const ENS_DOMAIN = "support-dev.eth";

async function main() {
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

  const registrar = {
    address: contracts.ForeverSubnameRegistrar.address as `0x${string}`,
    abi: contracts.ForeverSubnameRegistrar.abi,
  };

  const nameWrapper = {
    address: contracts.NameWrapper.address as `0x${string}`,
    abi: contracts.NameWrapper.abi,
  };

  const resolver = {
    address: contracts.PublicResolver.address as `0x${string}`,
    abi: contracts.PublicResolver.abi,
  };

  const reverseRegistrar = {
    address: contracts.ReverseRegistrar.address as `0x${string}`,
    abi: contracts.ReverseRegistrar.abi,
  };

  const universalResolver = {
    address: contracts.UniversalResolver.address as `0x${string}`,
    abi: contracts.UniversalResolver.abi,
  };

  const factory = {
    address: contracts.StrategyFactory.address as `0x${string}`,
    abi: contracts.StrategyFactory.abi,
  };

  // Check subname availability
  const labels = ["one", "two", "test", "hello"];

  console.log(`\nSubname Availability (*.${ENS_DOMAIN}):`);
  console.log("----------------------------------");

  for (const label of labels) {
    const available = await publicClient.readContract({
      ...registrar,
      functionName: "available",
      args: [label],
    });
    console.log(
      `${label}.${ENS_DOMAIN}: ${available ? "✅ available" : "❌ taken"}`,
    );
  }

  // Register two.${ENS_DOMAIN} if available
  const twoAvailable = await publicClient.readContract({
    ...registrar,
    functionName: "available",
    args: ["two"],
  });

  if (twoAvailable) {
    console.log(`\nRegistering two.${ENS_DOMAIN}...`);
    const hash = await walletClient.writeContract({
      ...registrar,
      functionName: "register",
      args: ["two", account.address],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ two.${ENS_DOMAIN} registered!`);
  }

  // Check ownership of registered names
  console.log("\nRegistered Names:");
  console.log("-----------------");

  for (const name of [ENS_DOMAIN, `one.${ENS_DOMAIN}`, `two.${ENS_DOMAIN}`]) {
    const node = namehash(name);
    const [owner] = (await publicClient.readContract({
      ...nameWrapper,
      functionName: "getData",
      args: [BigInt(node)],
    })) as [string, number, bigint];
    console.log(`${name}: ${owner}`);
  }

  // === Test factory.create with ENS label ===
  console.log("\n\n=== Testing factory.create with ENS label ===");
  console.log("=============================================\n");

  const strategyLabel = "test-strategy";
  const strategyAvailable = await publicClient.readContract({
    ...registrar,
    functionName: "available",
    args: [strategyLabel],
  });

  if (strategyAvailable) {
    console.log(
      `1. Creating strategy with ENS label "${strategyLabel}"...`,
    );
    const config = {
      owner: account.address,
      sourceStrategy: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      allocations: [
        {
          recipient: account.address,
          weight: 100n,
          label: "Test Recipient",
        },
      ],
      metadataURI: "",
    };

    const hash = await walletClient.writeContract({
      ...factory,
      functionName: "create",
      args: [config, strategyLabel],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ Strategy created! tx: ${receipt.transactionHash}`);

    // Check forward resolution
    const fullName = `${strategyLabel}.${ENS_DOMAIN}`;
    const node = namehash(fullName);
    const resolvedAddr = await publicClient.readContract({
      ...resolver,
      functionName: "addr",
      args: [node],
    });
    console.log(`\n2. Forward resolution: ${fullName} -> ${resolvedAddr}`);

    // Check reverse resolution
    console.log(`\n3. Testing reverse resolution via UniversalResolver...`);
    const addressBytes = (resolvedAddr as string).toLowerCase() as `0x${string}`;
    try {
      const [name] = (await publicClient.readContract({
        ...universalResolver,
        functionName: "reverse",
        args: [addressBytes, 60n],
      })) as [string, string, string];

      if (name === fullName) {
        console.log(
          `   ✅ Reverse resolution works! ${resolvedAddr} -> ${name}`,
        );
      } else if (name) {
        console.log(
          `   ⚠️  Unexpected name: expected "${fullName}", got "${name}"`,
        );
      } else {
        console.log(`   ❌ Reverse resolution returned empty name`);
      }
    } catch (error) {
      console.log(`   ❌ Reverse resolution failed:`, error);
    }

    // Check name ownership transferred to strategy
    const [nameOwner] = (await publicClient.readContract({
      ...nameWrapper,
      functionName: "getData",
      args: [BigInt(node)],
    })) as [string, number, bigint];
    console.log(`\n4. ENS name owner: ${nameOwner}`);
    console.log(`   Strategy address: ${resolvedAddr}`);
    console.log(
      `   ✅ Name owned by strategy: ${nameOwner.toLowerCase() === (resolvedAddr as string).toLowerCase()}`,
    );
  } else {
    console.log(`"${strategyLabel}" already taken, skipping factory test`);
  }

  // === Test factory.create without ENS (empty label) ===
  console.log("\n\n=== Testing factory.create without ENS ===");
  console.log("==========================================\n");

  const configNoENS = {
    owner: account.address,
    sourceStrategy: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    allocations: [
      {
        recipient: account.address,
        weight: 100n,
        label: "Test Recipient",
      },
    ],
    metadataURI: "",
  };

  const hashNoENS = await walletClient.writeContract({
    ...factory,
    functionName: "create",
    args: [configNoENS, ""],
  });
  const receiptNoENS = await publicClient.waitForTransactionReceipt({
    hash: hashNoENS,
  });
  console.log(
    `✅ Strategy created without ENS! tx: ${receiptNoENS.transactionHash}`,
  );

  // Summary
  console.log("\n\n=== Summary ===");
  console.log("===============");
  console.log(`UniversalResolver: ${universalResolver.address}`);
  console.log(`ReverseRegistrar: ${reverseRegistrar.address}`);
  console.log(`PublicResolver: ${resolver.address}`);
  console.log(`StrategyFactory: ${factory.address}`);
}

main().catch(console.error);
