import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { generateGithubProof } from "@ethereum-canonical-registry/contracts/backend/generateGithubProof"

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies()
  const oauthToken = cookieStore.get("gh_access_token")?.value

  if (!oauthToken) {
    return NextResponse.json({ error: "Not authenticated with GitHub" }, { status: 401 })
  }

  const { owner, repo, claimant, registryAddress, chainId } = await request.json()

  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY
  if (!signerPrivateKey) {
    return NextResponse.json({ error: "Signer not configured" }, { status: 500 })
  }

  try {
    const proof = await generateGithubProof({
      oauthToken,
      owner,
      repo,
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
