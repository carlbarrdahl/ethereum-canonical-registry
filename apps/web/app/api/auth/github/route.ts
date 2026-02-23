import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 })
  }

  const origin = new URL(request.url).origin
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/github/callback`,
    scope: "repo",
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("gh_access_token")
  return NextResponse.json({ ok: true })
}
