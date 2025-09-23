import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const isAuthenticated = cookieStore.get("admin-auth")?.value === "true"

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Create unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const filename = `${timestamp}.${fileExtension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      filename,
      url: blob.url,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
