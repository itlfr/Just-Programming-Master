import type React from "react"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
})

export const metadata: Metadata = {
  title: "Just Programming - Learn. Code. Build.",
  description: "مدونة عربية متخصصة في البرمجة والتطوير التقني - تعلم، اكتب الكود، ابني",
  icons: {
    icon: [
      { url: "/favicon.jpg", sizes: "32x32", type: "image/png" },
      { url: "/favicon.jpg", sizes: "192x192", type: "image/jpeg" },
    ],
    apple: "/favicon.jpg",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
