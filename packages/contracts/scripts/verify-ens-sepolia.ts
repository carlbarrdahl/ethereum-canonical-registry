import { createPublicClient, createWalletClient, http, namehash } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
import deployments from "../deployments.json";

config({ path: ".env" });
// Load environment variables
config();

const CHAIN_ID = "11155111"; // Sepolia
const ENS_DOMAIN = "support-dev.eth";

// Official Sepolia ENS addresses (for verification)
const OFFICIAL_SEPOLIA_ENS = {
  nameWrapper: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
  publicResolver: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
  reverseRegistrar: "0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6",
};

async function main() {
  // Load deployed contracts for Sepolia
  const contracts = (
    deployments as Record<
      string,
      Record<string, { address: string; abi: unknown[] }>
    >
  )[CHAIN_ID];

  if (!contracts) {
    console.error(`❌ No deployments found for chain ID ${CHAIN_ID}`);
    process.exit(1);
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  console.log("rpcUrl:", rpcUrl, process.env.SEPOLIA_RPC_URL);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Setup wallet client if private key is provided
  let walletClient;
  let account;
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (privateKey) {
    account = privateKeyToAccount(privateKey as `0x${string}`);
    walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    });
  }

  console.log("\n=== Sepolia ENS Deployment Verification ===");
  console.log("===========================================\n");

  // 1. Verify we're using official Sepolia ENS contracts (not deploying new ones)
  console.log("1. Verifying ENS Infrastructure:");
  console.log("   --------------------------------");

  const nameWrapperAddr = contracts.NameWrapper?.address;
  const resolverAddr = contracts.PublicResolver?.address;
  const reverseRegistrarAddr = contracts.ReverseRegistrar?.address;

  if (nameWrapperAddr === OFFICIAL_SEPOLIA_ENS.nameWrapper) {
    console.log(`   ✅ NameWrapper: Using official Sepolia contract`);
    console.log(`      ${nameWrapperAddr}`);
  } else {
    console.log(`   ⚠️  NameWrapper: NOT using official contract`);
    console.log(`      Expected: ${OFFICIAL_SEPOLIA_ENS.nameWrapper}`);
    console.log(`      Got:      ${nameWrapperAddr || "not found"}`);
  }

  if (resolverAddr) {
    console.log(`   ℹ️  PublicResolver: ${resolverAddr}`);
  }

  if (reverseRegistrarAddr === OFFICIAL_SEPOLIA_ENS.reverseRegistrar) {
    console.log(`   ✅ ReverseRegistrar: Using official Sepolia contract`);
    console.log(`      ${reverseRegistrarAddr}`);
  } else {
    console.log(`   ⚠️  ReverseRegistrar: NOT using official contract`);
    console.log(`      Expected: ${OFFICIAL_SEPOLIA_ENS.reverseRegistrar}`);
    console.log(`      Got:      ${reverseRegistrarAddr || "not found"}`);
  }

  // 2. Verify ForeverSubnameRegistrar deployment
  console.log("\n2. Verifying ForeverSubnameRegistrar:");
  console.log("   -----------------------------------");

  const registrar = contracts.ForeverSubnameRegistrar;
  if (!registrar) {
    console.error("   ❌ ForeverSubnameRegistrar not found in deployments!");
    process.exit(1);
  }

  console.log(`   ✅ Deployed at: ${registrar.address}`);

  const registrarContract = {
    address: registrar.address as `0x${string}`,
    abi: registrar.abi,
  };

  const nameWrapper = {
    address: nameWrapperAddr as `0x${string}`,
    abi: contracts.NameWrapper.abi,
  };

  const resolver = {
    address: resolverAddr as `0x${string}`,
    abi: contracts.PublicResolver.abi,
  };

  // 3. Verify parent domain ownership and wrapping
  console.log("\n3. Verifying Parent Domain:");
  console.log("   -------------------------");

  const parentNode = namehash(ENS_DOMAIN);
  console.log(`   Domain: ${ENS_DOMAIN}`);
  console.log(`   Node: ${parentNode}`);

  try {
    const [owner, fuses, expiry] = (await publicClient.readContract({
      ...nameWrapper,
      functionName: "getData",
      args: [BigInt(parentNode)],
    })) as [string, number, bigint];

    console.log(`   Owner: ${owner}`);
    console.log(`   Fuses: ${fuses}`);
    console.log(`   Expiry: ${expiry}`);

    if (owner === "0x0000000000000000000000000000000000000000") {
      console.log(`   ❌ Parent domain is NOT wrapped!`);
      console.log(
        `   You need to wrap ${ENS_DOMAIN} before the registrar can work`,
      );
    } else {
      console.log(`   ✅ Parent domain is wrapped`);
    }
  } catch (error) {
    console.log(`   ❌ Failed to read parent domain data:`, error);
  }

  // 4. Test subname availability
  console.log(`\n4. Testing Subname Availability:`);
  console.log("   ------------------------------");

  const testLabels = ["one", "two", "test", "hello", "alice", "bob"];

  for (const label of testLabels) {
    try {
      const available = await publicClient.readContract({
        ...registrarContract,
        functionName: "available",
        args: [label],
      });
      console.log(
        `   ${label}.${ENS_DOMAIN}: ${available ? "✅ available" : "❌ taken"}`,
      );
    } catch (error) {
      console.log(`   ${label}.${ENS_DOMAIN}: ❌ Error checking availability`);
    }
  }

  // 5. Check if registrar is approved to manage parent domain
  console.log(`\n5. Checking Registrar Approval:`);
  console.log("   -----------------------------");

  try {
    const [owner] = (await publicClient.readContract({
      ...nameWrapper,
      functionName: "getData",
      args: [BigInt(parentNode)],
    })) as [string, number, bigint];

    const isApproved = await publicClient.readContract({
      ...nameWrapper,
      functionName: "isApprovedForAll",
      args: [owner as `0x${string}`, registrar.address as `0x${string}`],
    });
    console.log("isApprovedForAll:");
    console.log([owner as `0x${string}`, registrar.address as `0x${string}`]);

    console.log("isApproved:", isApproved);
    console.log("");
    if (isApproved) {
      console.log(`   ✅ Registrar is approved to manage subnames`);
    } else {
      console.log(`   ⚠️  Registrar is NOT approved yet`);
      console.log(`   Owner needs to call:`);
      console.log(
        `   nameWrapper.setApprovalForAll("${registrar.address}", true)`,
      );
    }
  } catch (error) {
    console.log(`   ❌ Failed to check approval:`, error);
  }

  // 6. Try to register verify.support-dev.eth
  console.log(`\n6. Testing Registration (verify.${ENS_DOMAIN}):`);
  console.log("   ---------------------------------------------");

  const verifyLabel = "verify";
  const verifyName = `${verifyLabel}.${ENS_DOMAIN}`;

  try {
    const verifyAvailable = await publicClient.readContract({
      ...registrarContract,
      functionName: "available",
      args: [verifyLabel],
    });

    if (verifyAvailable) {
      console.log(`   ${verifyName} is available`);

      if (walletClient && account) {
        console.log(
          `   Attempting to register with account: ${account.address}`,
        );

        try {
          const hash = await walletClient.writeContract({
            ...registrarContract,
            functionName: "register",
            args: [verifyLabel, account.address],
          });

          console.log(`   Transaction submitted: ${hash}`);
          console.log(`   Waiting for confirmation...`);

          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          });

          if (receipt.status === "success") {
            console.log(`   ✅ Successfully registered ${verifyName}!`);

            // Verify ownership
            const verifyNode = namehash(verifyName);
            const [owner] = (await publicClient.readContract({
              ...nameWrapper,
              functionName: "getData",
              args: [BigInt(verifyNode)],
            })) as [string, number, bigint];

            console.log(`   Owner: ${owner}`);
          } else {
            console.log(`   ❌ Transaction failed`);
          }
        } catch (error: any) {
          console.log(`   ❌ Registration failed: ${error.message || error}`);
        }
      } else {
        console.log(
          `   ⚠️  No SEPOLIA_PRIVATE_KEY or PRIVATE_KEY in environment, skipping registration`,
        );
        console.log(
          `   Set SEPOLIA_PRIVATE_KEY or PRIVATE_KEY to test registration`,
        );
      }
    } else {
      console.log(`   ${verifyName} is already registered`);

      // Show current owner
      const verifyNode = namehash(verifyName);
      const [owner] = (await publicClient.readContract({
        ...nameWrapper,
        functionName: "getData",
        args: [BigInt(verifyNode)],
      })) as [string, number, bigint];

      console.log(`   Current owner: ${owner}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking/registering: ${error}`);
  }

  // 7. Check existing subnames
  console.log(`\n7. Checking Existing Subnames:`);
  console.log("   ----------------------------");

  for (const label of testLabels) {
    const subname = `${label}.${ENS_DOMAIN}`;
    const subnameNode = namehash(subname);

    try {
      const [owner] = (await publicClient.readContract({
        ...nameWrapper,
        functionName: "getData",
        args: [BigInt(subnameNode)],
      })) as [string, number, bigint];

      if (owner !== "0x0000000000000000000000000000000000000000") {
        console.log(`   ${subname}: owned by ${owner}`);

        // Check if it resolves to an address
        try {
          const addr = await publicClient.readContract({
            ...resolver,
            functionName: "addr",
            args: [subnameNode],
          });
          if (addr && addr !== "0x0000000000000000000000000000000000000000") {
            console.log(`      → resolves to ${addr}`);
          }
        } catch (e) {
          // Resolver might not be set
        }
      }
    } catch (error) {
      // Subname doesn't exist, skip
    }
  }

  // Summary
  console.log("\n\n=== Summary ===");
  console.log("===============");
  console.log(`Network: Sepolia (${CHAIN_ID})`);
  console.log(`ForeverSubnameRegistrar: ${registrar.address}`);
  console.log(`NameWrapper: ${nameWrapperAddr}`);
  console.log(`PublicResolver: ${resolverAddr}`);
  console.log(`ReverseRegistrar: ${reverseRegistrarAddr}`);
  console.log(`Parent Domain: ${ENS_DOMAIN}`);

  console.log("\n✅ Verification complete!");
}

main().catch(console.error);
