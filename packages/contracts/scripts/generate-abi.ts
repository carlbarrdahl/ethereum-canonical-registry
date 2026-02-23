import { promises as fs } from "fs";
import path from "path";

type AbiItem = Record<string, unknown>;

type ContractEntry = {
  address: string;
  abi: AbiItem[];
  startBlock?: number;
};

type ContractsByName = Record<string, ContractEntry>;

type DeploymentsOutput = Record<string, ContractsByName> & {
  beaconProxyBytecode?: string;
};

type DeploymentMetadata = {
  blockNumber?: number;
  contractAddress?: string;
};

type JournalEntry = {
  futureId?: string;
  type?: string;
  receipt?: {
    blockNumber?: number;
    contractAddress?: string;
  };
};

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

function parseChainIdFromDirName(dirName: string): number | null {
  // Expected pattern: chain-<id>
  const match = dirName.match(/chain-(\d+)/);
  return match ? Number(match[1]) : null;
}

async function readChainIdFromJournal(
  journalPath: string
): Promise<number | null> {
  try {
    const content = await fs.readFile(journalPath, "utf-8");
    // The journal is JSONL; find the first line with a chainId
    for (const line of content.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (typeof obj.chainId === "number") return obj.chainId;
      } catch {
        // ignore non-JSON lines
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function readDeploymentMetadata(
  chainDir: string
): Promise<Record<string, DeploymentMetadata>> {
  const journalPath = path.join(chainDir, "journal.jsonl");
  if (!(await pathExists(journalPath))) return {};

  try {
    const content = await fs.readFile(journalPath, "utf-8");
    const metadata: Record<string, DeploymentMetadata> = {};

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const entry = JSON.parse(trimmed) as JournalEntry;
        if (
          entry.type === "TRANSACTION_CONFIRM" &&
          entry.futureId &&
          entry.receipt?.blockNumber !== undefined
        ) {
          metadata[entry.futureId] = {
            blockNumber: entry.receipt.blockNumber,
            contractAddress: entry.receipt.contractAddress,
          };
        }
      } catch {
        // ignore malformed JSON lines
      }
    }

    return metadata;
  } catch {
    return {};
  }
}

async function discoverChainDirectories(
  deploymentsRoot: string
): Promise<string[]> {
  const entries = await fs.readdir(deploymentsRoot, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(deploymentsRoot, e.name));
}

/**
 * Scan the hardhat build-info directory for the BeaconProxy creation bytecode.
 * Returns the hex bytecode string (without 0x prefix), or null if not found.
 */
async function findBeaconProxyBytecode(
  repoRoot: string
): Promise<string | null> {
  const buildInfoDir = path.join(
    repoRoot,
    "packages",
    "contracts",
    "artifacts",
    "build-info"
  );
  if (!(await pathExists(buildInfoDir))) return null;

  const entries = await fs.readdir(buildInfoDir);
  const outputFiles = entries.filter((e) => e.endsWith(".output.json"));

  for (const file of outputFiles) {
    try {
      const data = await readJson<{
        output?: { contracts?: Record<string, Record<string, { evm?: { bytecode?: { object?: string } } }>> };
      }>(path.join(buildInfoDir, file));

      const contracts = data?.output?.contracts ?? {};
      for (const contractMap of Object.values(contracts)) {
        const bp = contractMap["BeaconProxy"];
        const bytecode = bp?.evm?.bytecode?.object;
        if (bytecode && bytecode.length > 0) return bytecode;
      }
    } catch {
      // ignore malformed files
    }
  }

  return null;
}

async function collectContractsForChain(
  chainDir: string
): Promise<{ chainId: number; contracts: ContractsByName } | null> {
  const dirName = path.basename(chainDir);
  let chainId = parseChainIdFromDirName(dirName);
  if (!chainId) {
    const journalPath = path.join(chainDir, "journal.jsonl");
    chainId =
      (await readChainIdFromJournal(journalPath)) ??
      (undefined as unknown as number);
  }
  if (!chainId) return null;

  const deployedAddressesPath = path.join(chainDir, "deployed_addresses.json");
  if (!(await pathExists(deployedAddressesPath))) return null;

  type DeployedAddresses = Record<string, string>;
  const deployed = await readJson<DeployedAddresses>(deployedAddressesPath);

  const artifactsDir = path.join(chainDir, "artifacts");
  const contracts: ContractsByName = {};

  const metadataByFutureId = await readDeploymentMetadata(chainDir);

  for (const [moduleAndName, address] of Object.entries(deployed)) {
    try {
      // moduleAndName like "CounterModule#Counter" or "DeployModule#TokenUSDC"
      const artifactPath = path.join(artifactsDir, `${moduleAndName}.json`);
      const artifact = await readJson<{ contractName: string; abi: AbiItem[] }>(
        artifactPath
      );
      
      // For TestToken and MockVault4626 contracts, use the artifact ID to differentiate instances
      // For other contracts, use the contractName
      const artifactId = moduleAndName.split("#").pop() || moduleAndName;
      const contractName = (artifact.contractName === "TestToken" || artifact.contractName === "MockVault4626")
        ? artifactId
        : (artifact.contractName || artifactId);
      
      const metadata = metadataByFutureId[moduleAndName];
      const normalizedAddress = address.toLowerCase();
      const startBlock =
        metadata?.contractAddress &&
        metadata.contractAddress.toLowerCase() === normalizedAddress
          ? metadata.blockNumber
          : metadata?.blockNumber;

      contracts[contractName] = {
        address,
        abi: artifact.abi,
        ...(startBlock !== undefined ? { startBlock } : {}),
      };
    } catch (err) {
      console.warn(
        `Warning: failed to load artifact for ${moduleAndName} at chain dir ${dirName}:`,
        err
      );
    }
  }

  return { chainId, contracts };
}

async function ensureDirectoryForFile(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function writeOutput(
  destinations: string[],
  data: DeploymentsOutput
): Promise<void> {
  for (const dest of destinations) {
    try {
      await ensureDirectoryForFile(dest);
      const ext = path.extname(dest).toLowerCase();
      if (ext === ".ts" || ext === ".tsx") {
        const content = `export const deployments = ${JSON.stringify(data, null, 2)} as const;\n`;
        await fs.writeFile(dest, content, "utf-8");
      } else if (ext === ".json" || !ext) {
        await fs.writeFile(dest, JSON.stringify(data, null, 2), "utf-8");
      } else {
        // Default to JSON for unknown extensions
        await fs.writeFile(dest, JSON.stringify(data, null, 2), "utf-8");
      }
      console.log(`Wrote deployments to ${dest}`);
    } catch (err) {
      console.error(`Failed to write output to ${dest}:`, err);
    }
  }
}

async function main(): Promise<void> {
  // Allow passing destination paths as CLI args; fallback to single source of truth
  const destinationsFromArgs = process.argv.slice(2).filter(Boolean);

  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  // Single source of truth: packages/contracts/deployments.json
  // Other packages import from @ethereum-canonical-registry/contracts/deployments.json
  const defaultDestinations = [
    path.join(repoRoot, "packages", "contracts", "deployments.json"),
  ];

  const destinations =
    destinationsFromArgs.length > 0
      ? destinationsFromArgs
      : defaultDestinations;

  const deploymentsRoot = path.resolve(
    __dirname,
    "..",
    "ignition",
    "deployments"
  );
  if (!(await pathExists(deploymentsRoot))) {
    throw new Error(`Deployments folder not found: ${deploymentsRoot}`);
  }

  const chainDirs = await discoverChainDirectories(deploymentsRoot);
  const beaconProxyBytecode = await findBeaconProxyBytecode(repoRoot);
  if (!beaconProxyBytecode) {
    console.warn("Warning: BeaconProxy bytecode not found in build-info; run `hardhat compile` first.");
  }

  const output: DeploymentsOutput = {};

  for (const chainDir of chainDirs) {
    const result = await collectContractsForChain(chainDir);
    if (!result) continue;
    const { chainId, contracts } = result;
    if (Object.keys(contracts).length === 0) continue;
    output[String(chainId)] = contracts;
  }

  if (beaconProxyBytecode) {
    output.beaconProxyBytecode = beaconProxyBytecode;
  }

  if (Object.keys(output).length === 0) {
    console.warn("No deployments found; output will be an empty object.");
  }

  await writeOutput(destinations, output);
}

// Run
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
