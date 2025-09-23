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

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Attempting to connect to database...")
    await connectDB()
    console.log("[v0] Database connected, fetching posts...")
    const posts = await Post.find().sort({ createdAt: -1 })
    console.log("[v0] Found", posts.length, "posts")
    return NextResponse.json(posts)
  } catch (error) {
    console.error("[v0] Error in GET /api/posts:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("[v0] POST request received")

  if (!verifyAdminAuth(request)) {
    console.log("[v0] Authentication failed")
    return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول أولاً" }, { status: 401 })
  }

  console.log("[v0] Authentication successful")

  try {
    console.log("[v0] Attempting to connect to database...")
    await connectDB()
    console.log("[v0] Database connected, parsing request body...")
    const body = await request.json()
    console.log("[v0] Request body:", body)

    if (!body.title || !body.content || !body.author) {
      console.error("[v0] Missing required fields:", {
        title: !!body.title,
        content: !!body.content,
        author: !!body.author,
      })
      return NextResponse.json(
        {
          error: "حقول مطلوبة مفقودة",
          details: "العنوان والمحتوى والكاتب مطلوبين",
          missingFields: {
            title: !body.title,
            content: !body.content,
            author: !body.author,
          },
        },
        { status: 400 },
      )
    }

    console.log("[v0] Creating new post...")
    const post = new Post(body)
    await post.save()
    console.log("[v0] Post saved successfully:", post._id)
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/posts:", error)
    return NextResponse.json(
      {
        error: "فشل في إنشاء المقال",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
