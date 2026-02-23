import dns from "node:dns/promises"
import { NextResponse } from "next/server"
import { signProof } from "@/lib/signProof"

const TXT_SUBDOMAIN = "_eth-canonical"

async function resolveDomainOwner(domain: string): Promise<string | null> {
  const resolver = new dns.Resolver()
  resolver.setServers(["8.8.8.8", "1.1.1.1"])
  const records = await resolver.resolveTxt(`${TXT_SUBDOMAIN}.${domain}`)

  for (const chunks of records) {
    const value = chunks.join("").trim()
    if (/^0x[0-9a-fA-F]{40}$/.test(value)) {
      return value.toLowerCase()
    }
  }

  return null
}

export async function POST(request: Request): Promise<NextResponse> {
  const { domain, claimant, registryAddress, chainId } = await request.json()

  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY
  if (!signerPrivateKey) {
    return NextResponse.json({ error: "Signer not configured" }, { status: 500 })
  }

  try {
    console.log("domain", domain)
    console.log("claimant", claimant)
    console.log("registryAddress", registryAddress)
    console.log("chainId", chainId)
    const canonicalDomain = domain.toLowerCase().replace(/\.$/, "")

    const recordAddress = await resolveDomainOwner(canonicalDomain)
console.log("recordAddress", recordAddress)
    if (!recordAddress) {
      return NextResponse.json(
        {
          error:
            `No valid Ethereum address found at ${TXT_SUBDOMAIN}.${canonicalDomain}. ` +
            `Add a TXT record with value "${claimant}".`,
        },
        { status: 400 }
      )
    }

    if (recordAddress !== claimant.toLowerCase()) {
      return NextResponse.json(
        {
          error: `TXT record address (${recordAddress}) does not match claimant (${claimant.toLowerCase()})`,
        },
        { status: 400 }
      )
    }

    const proof = await signProof({
      namespace: "dns",
      canonicalString: canonicalDomain,
      claimant,
      registryAddress,
      chainId,
      signerPrivateKey,
    })

    return NextResponse.json({ proof })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
