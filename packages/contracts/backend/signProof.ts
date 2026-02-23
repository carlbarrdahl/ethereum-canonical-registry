import { ethers } from "ethers"

export const PROOF_TTL_SECONDS = 3600 // proofs are valid for 1 hour

const EIP712_DOMAIN = {
  name: "CanonicalRegistry",
  version: "1",
}

const OWNERSHIP_PROOF_TYPES = {
  OwnershipProof: [
    { name: "id", type: "bytes32" },
    { name: "claimant", type: "address" },
    { name: "expiry", type: "uint256" },
  ],
}

/**
 * Signs a canonical ownership proof using EIP-712 typed data and returns
 * ABI-encoded bytes ready to submit as the `proof` argument to
 * `CanonicalRegistry.claim()`.
 *
 * The EIP-712 domain includes chainId and verifyingContract (registry address),
 * preventing both cross-chain and cross-deployment replay.
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

  const id = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string"],
      [namespace, canonicalString]
    )
  )

  const expiry = Math.floor(Date.now() / 1000) + PROOF_TTL_SECONDS

  const domain = {
    ...EIP712_DOMAIN,
    chainId,
    verifyingContract: registryAddress,
  }

  const value = { id, claimant, expiry }

  const signer = new ethers.Wallet(signerPrivateKey)
  const signature = await signer.signTypedData(domain, OWNERSHIP_PROOF_TYPES, value)

  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes", "uint256"],
    [signature, expiry]
  )
}
