import { Context } from "ponder:registry";
import { Address, erc20Abi } from "viem";
import pRetry from "p-retry";
import { cachedFetchWithRetry } from "./fetch";
import { isNativeToken } from "@workspace/sdk";

const MAX_RETRY_COUNT = 5;

export type Metadata = {
  title: string;
  description: string;
  image?: string;
};

// Get base URL for metadata API from environment
const METADATA_API_BASE_URL = process.env.METADATA_API_BASE_URL || "http://localhost:3000";

export async function fetchMetadata(uri: string): Promise<Metadata> {
  const defaultMetadata: Metadata = { title: "", description: "" };
  if (!uri) return defaultMetadata;

  // If it's already a full URL (e.g., Vercel Blob), fetch directly
  const url = uri.startsWith("http")
    ? uri
    : `${METADATA_API_BASE_URL}/api/ipfs/${uri}`;

  return cachedFetchWithRetry<Metadata>(url).catch(() => {
    return defaultMetadata;
  });
}

export async function fetchToken(address: Address, client: Context["client"]) {
  // Handle native ETH (both zero address and ERC-7528 standard address)
  if (isNativeToken(address)) {
    return [18, "ETH"] as const;
  }

  return pRetry(
    () => {
      const tokenContract = {
        abi: erc20Abi,
        address,
        cache: "immutable",
      } as const;
      return Promise.all([
        client.readContract({ ...tokenContract, functionName: "decimals" }),
        client.readContract({ ...tokenContract, functionName: "symbol" }),
      ]);
    },
    { retries: MAX_RETRY_COUNT },
  );
}
