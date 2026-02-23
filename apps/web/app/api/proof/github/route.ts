import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { signProof } from "@/lib/signProof"

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
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `Bearer ${oauthToken}`, Accept: "application/vnd.github.v3+json" },
    })

    if (repoRes.status === 401) {
      return NextResponse.json({ error: "GitHub token expired, please reconnect" }, { status: 401 })
    }
    if (!repoRes.ok) {
      return NextResponse.json({ error: `Repository ${owner}/${repo} not found` }, { status: 404 })
    }

    const repoData = await repoRes.json()
    if (!repoData.permissions?.admin) {
      return NextResponse.json({ error: `You are not an admin of ${owner}/${repo}` }, { status: 403 })
    }

    const canonicalString = `${owner.toLowerCase()}/${repo.toLowerCase()}`
    const proof = await signProof({
      namespace: "github",
      canonicalString,
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
