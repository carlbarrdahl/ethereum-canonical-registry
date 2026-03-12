import { zeroAddress, type Address } from "viem";
import deployments from "@ethereum-entity-registry/contracts/deployments.json";

export type TokenConfig = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};

type ChainTokens = Record<string, TokenConfig>;

/**
 * Native ETH address per ERC-7528 standard
 * Used throughout the system to represent native ETH
 */
export const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const isNativeToken = (token = ""): boolean => {
  return [zeroAddress, NATIVE_TOKEN]
    .map((t) => t.toLowerCase())
    .includes(token.toLowerCase());
};
/**
 * Native ETH token config
 */
export const ETH_TOKEN: TokenConfig = {
  address: NATIVE_TOKEN,
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
};

// Production token addresses
const MAINNET_TOKENS: ChainTokens = {
  ETH: ETH_TOKEN,
  WETH: {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
  },
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  DAI: {
    address: "0x6B175474E89094C44Da98b954EedeAC8cB7A86Bf",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
  },
};

// Token metadata for mapping deployment keys to token info
const TOKEN_METADATA: Record<string, Omit<TokenConfig, "address">> = {
  TokenUSDC: { symbol: "USDC", name: "USD Coin", decimals: 6 },
  TokenWETH: { symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
  TokenUSDT: { symbol: "USDT", name: "Tether USD", decimals: 6 },
  TokenDAI: { symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
};

// Build tokens from deployments for testnet
function getTestnetTokens(chainId: string): ChainTokens {
  const d = deployments[chainId as keyof typeof deployments] as
    | Record<string, { address: string }>
    | undefined;

  if (!d) return { ETH: ETH_TOKEN };

  const tokens: ChainTokens = {
    ETH: ETH_TOKEN, // Always include native ETH
  };

  for (const [key, meta] of Object.entries(TOKEN_METADATA)) {
    if (d[key]?.address) {
      tokens[meta.symbol] = { ...meta, address: d[key].address as Address };
    }
  }
  return tokens;
}

// Chain-specific token configurations
const TOKEN_CONFIG: Record<number, ChainTokens> = {
  1: MAINNET_TOKENS,
  11155111: getTestnetTokens("11155111"), // Sepolia
  31337: getTestnetTokens("31337"), // Local
};

/**
 * Get all available tokens for a chain
 */
export function getTokens(chainId: number): TokenConfig[] {
  return Object.values(TOKEN_CONFIG[chainId] ?? {});
}

/**
 * Get a token by symbol for a chain
 */
export function getToken(
  chainId: number,
  symbol: string,
): TokenConfig | undefined {
  return TOKEN_CONFIG[chainId]?.[symbol];
}

/**
 * Get a token by address for a chain
 */
export function getTokenByAddress(
  chainId: number,
  address: Address,
): TokenConfig | undefined {
  return getTokens(chainId).find(
    (t) => t.address.toLowerCase() === address.toLowerCase(),
  );
}

/**
 * Get token addresses for a chain (useful for indexer)
 */
export function getTokenAddresses(chainId: number): Address[] {
  return getTokens(chainId).map((t) => t.address);
}
