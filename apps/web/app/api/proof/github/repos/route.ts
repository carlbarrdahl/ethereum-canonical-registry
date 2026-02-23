import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("gh_access_token")?.value


  console.log({token})
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const [userRes, reposRes] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
    }),
    fetch("https://api.github.com/user/repos?per_page=100&type=all&sort=updated", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
    }),
  ])

  if (!userRes.ok || !reposRes.ok) {
    if (userRes.status === 401 || reposRes.status === 401) {
      const cookieStoreClean = await cookies()
      cookieStoreClean.delete("gh_access_token")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    return NextResponse.json({ error: "Failed to fetch GitHub data" }, { status: 502 })
  }

  const [user, repos] = await Promise.all([userRes.json(), reposRes.json()])

  const adminRepos = repos
    .filter((r: { permissions?: { admin: boolean } }) => r.permissions?.admin === true)
    .map((r: { owner: { login: string }; name: string; full_name: string; private: boolean }) => ({
      owner: r.owner.login,
      repo: r.name,
      fullName: r.full_name,
      private: r.private,
    }))

  return NextResponse.json({ user: { login: user.login, avatarUrl: user.avatar_url }, repos: adminRepos })
}
