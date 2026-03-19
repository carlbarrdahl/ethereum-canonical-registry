import { network } from "hardhat";

const NEW_SIGNER = "0x6863ea32eC7Fba56fa4CEaa3030c95eCCACe50BD" as const;

const DNS_VERIFIER = "0xD1AF4F708289FB114eaF3a880e94B185618b4144" as const;
const GITHUB_VERIFIER = "0xefaa6Be4FD67fBF0F471258A93E112570CB09F7F" as const;

const abi = [
  {
    name: "setTrustedSigner",
    type: "function",
    inputs: [{ name: "signer", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "trustedSigner",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

const { viem } = await network.connect({
  network: "base-sepolia",
  chainType: "op",
});

const publicClient = await viem.getPublicClient();
const [walletClient] = await viem.getWalletClients();

console.log("Admin:", walletClient.account.address);
console.log("New trusted signer:", NEW_SIGNER);
console.log();

for (const [name, address] of [["DnsVerifier", DNS_VERIFIER], ["GitHubVerifier", GITHUB_VERIFIER]] as const) {
  const current = await publicClient.readContract({ address, abi, functionName: "trustedSigner" });
  console.log(`${name} current signer: ${current}`);

  if (current.toLowerCase() === NEW_SIGNER.toLowerCase()) {
    console.log(`  → already set, skipping\n`);
    continue;
  }

  const hash = await walletClient.writeContract({ address, abi, functionName: "setTrustedSigner", args: [NEW_SIGNER] });
  console.log(`  → tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  → confirmed in block ${receipt.blockNumber}\n`);
}

console.log("Done.");
