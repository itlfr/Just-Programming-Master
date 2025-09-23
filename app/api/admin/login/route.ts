import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      console.error("[v0] ADMIN_PASSWORD environment variable is not set")
      return NextResponse.json({ error: "خطأ في إعدادات الخادم" }, { status: 500 })
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: "كلمة مرور خاطئة" }, { status: 401 })
    }

    const token = jwt.sign({ admin: true, timestamp: Date.now() }, adminPassword, {
      expiresIn: "24h",
    })

    console.log("[v0] Admin login successful")
    return NextResponse.json({
      success: true,
      token,
      message: "تم تسجيل الدخول بنجاح",
    })
  } catch (error) {
    console.error("[v0] Error in admin login:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}
