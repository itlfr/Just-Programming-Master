import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const authCookie = cookieStore.get("admin-auth")

    if (authCookie?.value === "true") {
      return NextResponse.json({ authenticated: true })
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Authentication check failed" }, { status: 500 })
  }
}
