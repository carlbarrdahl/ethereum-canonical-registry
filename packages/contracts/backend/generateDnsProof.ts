import dns from "node:dns/promises"
import { signProof } from "./signProof"

// Domain owners set this TXT record to register their Ethereum address:
//   _eth-canonical.example.com  TXT  "0xYourAddress"
const TXT_SUBDOMAIN = "_eth-canonical"

async function resolveDomainOwner(domain: string): Promise<string | null> {
  const records = await dns.resolveTxt(`${TXT_SUBDOMAIN}.${domain}`)

  for (const chunks of records) {
    const value = chunks.join("").trim()
    if (/^0x[0-9a-fA-F]{40}$/.test(value)) {
      return value.toLowerCase()
    }
  }

  return null
}

export async function generateDnsProof(params: {
  domain: string
  claimant: string
  registryAddress: string
  chainId: number
  signerPrivateKey: string
}): Promise<string> {
  const { domain, claimant, registryAddress, chainId, signerPrivateKey } = params

  const canonicalDomain = domain.toLowerCase().replace(/\.$/, "")

  const recordAddress = await resolveDomainOwner(canonicalDomain)

  if (!recordAddress) {
    throw new Error(
      `No valid Ethereum address found at ${TXT_SUBDOMAIN}.${canonicalDomain}. ` +
      `Add a TXT record with value "${claimant}".`
    )
  }

  if (recordAddress !== claimant.toLowerCase()) {
    throw new Error(
      `TXT record address (${recordAddress}) does not match claimant (${claimant.toLowerCase()})`
    )
  }

  return signProof({ namespace: "dns", canonicalString: canonicalDomain, claimant, registryAddress, chainId, signerPrivateKey })
}
