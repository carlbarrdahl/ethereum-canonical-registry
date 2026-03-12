import { encodeAbiParameters, keccak256 } from "viem"
import { privateKeyToAccount } from "viem/accounts"

export const PROOF_TTL_SECONDS = 3600

const EIP712_DOMAIN = {
  name: "EntityRegistry",
  version: "1",
} as const

const OWNERSHIP_PROOF_TYPES = {
  OwnershipProof: [
    { name: "id", type: "bytes32" },
    { name: "claimant", type: "address" },
    { name: "expiry", type: "uint256" },
  ],
} as const

/**
 * Signs a canonical ownership proof using EIP-712 typed data and returns
 * ABI-encoded bytes ready to submit as the `proof` argument to
 * `EntityRegistry.claim()`.
 */
export async function signProof(params: {
  namespace: string
  canonicalString: string
  claimant: string
  registryAddress: string
  chainId: number
  signerPrivateKey: string
}): Promise<string> {
  const { namespace, canonicalString, claimant, registryAddress, chainId, signerPrivateKey } = params

  const id = keccak256(
    encodeAbiParameters(
      [{ type: "string" }, { type: "string" }],
      [namespace, canonicalString]
    )
  )

  const expiry = BigInt(Math.floor(Date.now() / 1000) + PROOF_TTL_SECONDS)

  const domain = {
    ...EIP712_DOMAIN,
    chainId,
    verifyingContract: registryAddress as `0x${string}`,
  }

  const normalizedKey = signerPrivateKey.startsWith("0x")
    ? signerPrivateKey
    : `0x${signerPrivateKey}`

  if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedKey)) {
    throw new Error("SIGNER_PRIVATE_KEY must be a 32-byte hex string (64 hex chars, with or without 0x prefix)")
  }

  const account = privateKeyToAccount(normalizedKey as `0x${string}`)

  const signature = await account.signTypedData({
    domain,
    types: OWNERSHIP_PROOF_TYPES,
    primaryType: "OwnershipProof",
    message: {
      id,
      claimant: claimant as `0x${string}`,
      expiry,
    },
  })

  return encodeAbiParameters(
    [{ type: "bytes" }, { type: "uint256" }],
    [signature, expiry]
  )
}
