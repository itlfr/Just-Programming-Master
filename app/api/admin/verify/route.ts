import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ valid: false, error: "رمز التفويض مفقود" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    const secret = process.env.ADMIN_PASSWORD
    if (!secret) {
      console.error("[v0] ADMIN_PASSWORD environment variable is not set")
      return NextResponse.json({ valid: false, error: "خطأ في إعدادات الخادم" }, { status: 500 })
    }

    jwt.verify(token, secret)
    console.log("[v0] Token verified successfully")
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("[v0] Token verification failed:", error)
    return NextResponse.json({ valid: false, error: "رمز غير صحيح أو منتهي الصلاحية" }, { status: 401 })
  }
}
