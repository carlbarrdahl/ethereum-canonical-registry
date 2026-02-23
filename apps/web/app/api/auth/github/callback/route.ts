import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/prove?gh_error=no_code", origin))
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const data = await res.json()
  console.log("[github/callback] token exchange response:", data)

  if (data.error || !data.access_token) {
    return NextResponse.redirect(new URL(`/prove?gh_error=${data.error ?? "token_exchange"}`, origin))
  }

  const cookieStore = await cookies()
  cookieStore.set("gh_access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  })

  return NextResponse.redirect(new URL("/prove", origin))
}
