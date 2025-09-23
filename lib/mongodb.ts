import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL

declare global {
  var _mongoose: any
}

let cached = global._mongoose

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable in your Vercel project settings. Go to Project Settings → Environment Variables and add MONGODB_URI with your MongoDB connection string.",
    )
  }

  if (cached.conn) {
    console.log("[v0] Using cached database connection")
    return cached.conn
  }

  if (!cached.promise) {
    console.log("[v0] Creating new database connection...")
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("[v0] Database connection established")
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    console.error("[v0] Database connection failed:", e)
    cached.promise = null
    throw e
  }

  return cached.conn
}
