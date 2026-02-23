import { signProof } from "./signProof"

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

export async function generateGithubProof(params: {
  accessToken: string
  owner: string
  repo: string
  claimant: string
  registryAddress: string
  chainId: number
  signerPrivateKey: string
}): Promise<string> {
  const { accessToken, owner, repo, claimant, registryAddress, chainId, signerPrivateKey } = params

  const canonicalString = `${owner.toLowerCase()}/${repo.toLowerCase()}`

  if (!await isRepoAdmin(accessToken, owner, repo)) {
    throw new Error(`${claimant} is not an admin of ${canonicalString}`)
  }

  return signProof({ namespace: "github", canonicalString, claimant, registryAddress, chainId, signerPrivateKey })
}
