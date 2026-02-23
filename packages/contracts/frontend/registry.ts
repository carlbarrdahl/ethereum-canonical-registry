import { ethers } from "ethers"

/**
 * Import BeaconProxy creation bytecode from OZ build artifacts.
 * Replace with actual artifact path once compiled.
 *
 * e.g. import artifact from "../../artifacts/@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol/BeaconProxy.json"
 * const BEACON_PROXY_BYTECODE: string = artifact.bytecode
 */
declare const BEACON_PROXY_BYTECODE: string

const REGISTRY_ABI = [
  "function ownerOf(bytes32) view returns (address)",
  "function claim(string namespace, string canonicalString, bytes proof) external",
  "function revoke(string namespace, string canonicalString) external",
  "function linkIds(bytes32 primaryId, bytes32[] aliasIds) external",
  "function unlinkIds(bytes32 primaryId, bytes32[] aliasIds) external",
  "function deployEscrow(bytes32 id) external returns (address)",
]

const ESCROW_ABI = [
  "function withdrawTo(address token) external",
]

export type RegistryConfig = {
  registryAddress: string
  beaconAddress: string
  provider: ethers.Provider
}

export type IdentifierState = {
  id: string
  depositAddress: string
  owner: string | null
  balance: bigint
}

/**
 * Default canonicalization: lowercase, trim whitespace, strip trailing slash.
 * This is a baseline for most namespaces (github, dns).
 * Future namespaces may have their own rules (e.g. case-sensitive identifiers).
 * The contract itself does not enforce any normalization — it hashes whatever
 * strings are passed to toId(). Consistency is the caller's responsibility.
 */
export function canonicalise(value: string): string {
  return value.toLowerCase().trim().replace(/\/$/, "")
}

/**
 * Derive the bytes32 identifier for a (namespace, canonicalString) pair.
 * Matches: keccak256(abi.encode(namespace, canonicalString))
 * Uses abi.encode (length-prefixed) to prevent collisions between different
 * namespace/string pairs that share a common packed concatenation.
 */
export function toId(namespace: string, canonicalString: string): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string"],
      [namespace, canonicalString]
    )
  )
}

/**
 * Compute the deterministic deposit address for any identifier.
 * This is a pure local computation — no RPC call required.
 * The address is stable whether or not the escrow proxy has been deployed,
 * and does NOT change if the escrow implementation is upgraded via the beacon.
 *
 * Funders transfer ERC-20 tokens directly to this address.
 */
export function resolveDepositAddress(
  id: string,
  registryAddress: string,
  beaconAddress: string
): string {
  const initializeCalldata = new ethers.Interface([
    "function initialize(address,bytes32)"
  ]).encodeFunctionData("initialize", [registryAddress, id])

  const initcode = ethers.concat([
    BEACON_PROXY_BYTECODE,
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "bytes"],
      [beaconAddress, initializeCalldata]
    ),
  ])
  const initcodeHash = ethers.keccak256(initcode)
  return ethers.getCreate2Address(registryAddress, id, initcodeHash)
}

/**
 * Look up the registered owner of an identifier on-chain.
 * Returns null if the identifier is unclaimed.
 * Resolves through aliases transparently (ownerOf handles this on the contract).
 */
export async function getOwner(
  id: string,
  config: RegistryConfig
): Promise<string | null> {
  const registry = new ethers.Contract(
    config.registryAddress,
    ["function ownerOf(bytes32) view returns (address)"],
    config.provider
  )
  const owner: string = await registry.ownerOf(id)
  return owner === ethers.ZeroAddress ? null : owner
}

/**
 * Look up the ERC-20 balance held at a deposit address.
 * Anyone can call this — no wallet connection required.
 */
export async function getBalance(
  depositAddress: string,
  token: string,
  config: RegistryConfig
): Promise<bigint> {
  const erc20 = new ethers.Contract(
    token,
    ["function balanceOf(address) view returns (uint256)"],
    config.provider
  )
  return erc20.balanceOf(depositAddress)
}

/**
 * Resolve the full state of an identifier in two RPC calls.
 *
 * @example
 * const state = await resolveIdentifier("github", "org/repo", "0xTokenAddress", config)
 * // state.depositAddress — where funders should deposit (no RPC needed, returned for convenience)
 * // state.owner          — null if unclaimed
 * // state.balance        — claimable token balance
 */
export async function resolveIdentifier(
  namespace: string,
  canonicalString: string,
  token: string,
  config: RegistryConfig
): Promise<IdentifierState> {
  const id = toId(namespace, canonicalise(canonicalString))
  const depositAddress = resolveDepositAddress(id, config.registryAddress, config.beaconAddress)

  const [owner, balance] = await Promise.all([
    getOwner(id, config),
    getBalance(depositAddress, token, config),
  ])

  return { id, depositAddress, owner, balance }
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Format a namespace + canonicalString into a human-readable identifier string.
 * e.g. formatIdentifier("github", "org/repo") → "github:org/repo"
 */
export function formatIdentifier(namespace: string, canonicalString: string): string {
  return `${namespace}:${canonicalString}`
}

/**
 * Parse a colon-separated identifier string into its parts.
 * e.g. parseIdentifier("github:org/repo") → { namespace: "github", canonicalString: "org/repo" }
 */
export function parseIdentifier(identifier: string): { namespace: string; canonicalString: string } {
  const colonIndex = identifier.indexOf(":")
  if (colonIndex === -1) throw new Error(`Invalid identifier (missing namespace): "${identifier}"`)

  return {
    namespace: identifier.slice(0, colonIndex),
    canonicalString: identifier.slice(colonIndex + 1),
  }
}

export type ParsedUrl = {
  namespace: string
  canonicalString: string
  /** The normalised form, suitable for display: e.g. "github:org/repo" */
  formatted: string
}

/**
 * Parse a free-form URL or handle into a registry identifier.
 *
 * Accepts all of the following for a GitHub repo:
 *   github.com/org/repo
 *   https://github.com/org/repo
 *   https://www.github.com/org/repo/tree/main  (extra path segments ignored)
 *
 * Accepts all of the following for a DNS domain:
 *   example.com
 *   https://example.com
 *   https://www.example.com/some/path          (path ignored)
 *
 * Throws if the input cannot be mapped to a known namespace.
 */
export function parseUrl(input: string): ParsedUrl {
  const raw = input.trim()

  // Normalise to a URL we can parse. Prepend https:// if there's no scheme.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new Error(`Cannot parse "${input}" as a URL`)
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase()
  const pathParts = url.pathname.split("/").filter(Boolean)

  // ── GitHub ──────────────────────────────────────────────────────────────────
  if (host === "github.com") {
    if (pathParts.length < 2) {
      throw new Error(`GitHub URL must include owner and repo: "${input}"`)
    }
    const canonicalString = `${pathParts[0]}/${pathParts[1]}`.toLowerCase()
    return { namespace: "github", canonicalString, formatted: `github:${canonicalString}` }
  }

  // ── DNS domain ──────────────────────────────────────────────────────────────
  if (host.includes(".")) {
    return { namespace: "dns", canonicalString: host, formatted: `dns:${host}` }
  }

  throw new Error(`Cannot determine namespace for "${input}"`)
}

/**
 * Check whether the ClaimableEscrow for a deposit address has been deployed on-chain.
 * Returns false if the address has no code (escrow not yet deployed).
 * The registry deploys it automatically on claim, but this is useful for UI state.
 */
export async function isEscrowDeployed(
  depositAddress: string,
  provider: ethers.Provider
): Promise<boolean> {
  const code = await provider.getCode(depositAddress)
  return code !== "0x"
}

// -----------------------------------------------------------------------------
// Write — requires a signer (connected wallet)
// -----------------------------------------------------------------------------

/**
 * Claim ownership of an identifier by submitting a proof from the backend signing service.
 * The proof bytes are the ABI-encoded output of generateGithubProof / generateDnsProof / etc.
 */
export async function claim(
  namespace: string,
  canonicalString: string,
  proof: string,
  signer: ethers.Signer,
  registryAddress: string
): Promise<ethers.TransactionResponse> {
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, signer)
  return registry.claim(namespace, canonicalise(canonicalString), proof)
}

/**
 * Revoke ownership of a claimed identifier, returning it to unclaimed state.
 * Funds remain at the same escrow address and will be claimable
 * by whoever claims the identifier next.
 */
export async function revoke(
  namespace: string,
  canonicalString: string,
  signer: ethers.Signer,
  registryAddress: string
): Promise<ethers.TransactionResponse> {
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, signer)
  return registry.revoke(namespace, canonicalise(canonicalString))
}

/**
 * Withdraw the full balance of `token` from a claimed identifier's escrow
 * to the registered owner address.
 * Anyone can call this — funds always go to the registered owner.
 */
export async function withdraw(
  id: string,
  token: string,
  signer: ethers.Signer,
  config: RegistryConfig
): Promise<ethers.TransactionResponse> {
  const depositAddress = resolveDepositAddress(id, config.registryAddress, config.beaconAddress)
  const escrow = new ethers.Contract(depositAddress, ESCROW_ABI, signer)
  return escrow.withdrawTo(token)
}

/**
 * Link one or more alias identifiers to a primary identifier.
 * All identifiers must already be claimed by the signer's wallet.
 * All-or-nothing: any invalid alias reverts the entire transaction.
 */
export async function linkIds(
  primaryId: string,
  aliasIds: string[],
  signer: ethers.Signer,
  registryAddress: string
): Promise<ethers.TransactionResponse> {
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, signer)
  return registry.linkIds(primaryId, aliasIds)
}

/**
 * Unlink one or more aliases from their primary, restoring each as an
 * independently owned identifier. Caller must be the owner of the primary.
 * All-or-nothing: any invalid alias reverts the entire transaction.
 */
export async function unlinkIds(
  primaryId: string,
  aliasIds: string[],
  signer: ethers.Signer,
  registryAddress: string
): Promise<ethers.TransactionResponse> {
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, signer)
  return registry.unlinkIds(primaryId, aliasIds)
}

/**
 * Deploy the ClaimableEscrow for an identifier ahead of time.
 * Only needed if you want the escrow deployed before the owner claims.
 * The registry deploys it automatically during claim() if not already deployed.
 */
export async function deployEscrow(
  id: string,
  signer: ethers.Signer,
  registryAddress: string
): Promise<ethers.TransactionResponse> {
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, signer)
  return registry.deployEscrow(id)
}
