import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Post from "@/models/Post"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

function verifyAdminAuth(request: NextRequest) {
  // Check JWT token first (for modal admin panel)
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    try {
      const secret = process.env.ADMIN_PASSWORD
      if (secret) {
        jwt.verify(token, secret)
        console.log("[v0] JWT token verified successfully")
        return true
      }
    } catch (error) {
      console.log("[v0] JWT token verification failed:", error)
    }
  }

  // Check cookie-based auth (for /admin page)
  try {
    const cookieStore = cookies()
    const authCookie = cookieStore.get("admin-auth")
    if (authCookie?.value === "true") {
      console.log("[v0] Cookie authentication verified successfully")
      return true
    }
  } catch (error) {
    console.log("[v0] Cookie authentication check failed:", error)
  }

  return false
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] GET request received for post:", params.id)
    await connectDB()

    const post = await Post.findById(params.id)

    if (!post) {
      return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 })
    }

    console.log("[v0] Post fetched successfully:", post._id)
    return NextResponse.json(post)
  } catch (error) {
    console.error("[v0] Error in GET /api/posts/[id]:", error)
    return NextResponse.json(
      {
        error: "فشل في تحميل المقال",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] PUT request received for post:", params.id)

  if (!verifyAdminAuth(request)) {
    console.log("[v0] Authentication failed for PUT request")
    return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول أولاً" }, { status: 401 })
  }

  console.log("[v0] Authentication successful for PUT request")

  try {
    console.log("[v0] Attempting to update post:", params.id)
    await connectDB()
    const body = await request.json()
    console.log("[v0] Update data:", body)

    if (!body.title || !body.content || !body.author) {
      return NextResponse.json(
        {
          error: "حقول مطلوبة مفقودة",
          details: "العنوان والمحتوى والكاتب مطلوبين",
        },
        { status: 400 },
      )
    }

    const post = await Post.findByIdAndUpdate(params.id, body, { new: true })

    if (!post) {
      return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 })
    }

    console.log("[v0] Post updated successfully:", post._id)
    return NextResponse.json(post)
  } catch (error) {
    console.error("[v0] Error in PUT /api/posts:", error)
    return NextResponse.json(
      {
        error: "فشل في تحديث المقال",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول أولاً" }, { status: 401 })
  }

  try {
    console.log("[v0] Attempting to delete post:", params.id)
    await connectDB()
    const post = await Post.findByIdAndDelete(params.id)

    if (!post) {
      return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 })
    }

    console.log("[v0] Post deleted successfully:", params.id)
    return NextResponse.json({ message: "تم حذف المقال بنجاح" })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/posts:", error)
    return NextResponse.json(
      {
        error: "فشل في حذف المقال",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
