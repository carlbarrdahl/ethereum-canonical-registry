import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { signProof } from "@/lib/signProof"

const GITHUB_NAME_RE = /^[a-zA-Z0-9._-]+$/

async function isRepoAdmin(accessToken: string, owner: string, repo: string): Promise<boolean> {
  if (!GITHUB_NAME_RE.test(owner) || !GITHUB_NAME_RE.test(repo)) {
    throw new Error(`Invalid GitHub owner or repo name: "${owner}/${repo}"`)
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data.permissions?.admin === true
}

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("gh_access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated with GitHub" }, { status: 401 })
  }

  const { owner, repo, claimant, registryAddress, chainId } = await request.json()

  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY
  if (!signerPrivateKey) {
    return NextResponse.json({ error: "Signer not configured" }, { status: 500 })
  }

  try {
    const canonicalString = `${owner.toLowerCase()}/${repo.toLowerCase()}`

    if (!await isRepoAdmin(accessToken, owner, repo)) {
      return NextResponse.json(
        { error: `${claimant} is not an admin of ${canonicalString}` },
        { status: 403 }
      )
    }

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
