"use client"

import { useState, useEffect } from "react"
import { marked } from "marked"
import { Calendar, User, ArrowRight, Share2, Copy, Link, Clock } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import "prismjs/themes/prism-tomorrow.css"

interface Post {
  _id: string
  title: string
  titleDirection?: "rtl" | "ltr" | "auto"
  content: string
  author: string
  createdAt: string
  tags: string[]
  media?: string
}

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchPost(params.id as string)
    }
  }, [params.id])

  const fetchPost = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      } else {
        setError("المنشور غير موجود")
      }
    } catch (err) {
      setError("خطأ في تحميل المنشور")
    } finally {
      setLoading(false)
    }
  }

  const openVideoModal = (videoId: string) => {
    setCurrentVideoId(videoId)
    setShowVideoModal(true)
  }

  const closeVideoModal = () => {
    setShowVideoModal(false)
    setCurrentVideoId("")
  }

  const renderContent = (content: string) => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g
    let processedContent = content.replace(youtubeRegex, (match, videoId) => {
      return `<div class="my-6">
        <button 
          data-video-id="${videoId}"
          class="youtube-video-btn group relative w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl border border-red-500/20"
        >
          <div class="flex items-center justify-center gap-4">
            <div class="bg-white/10 rounded-full p-3 group-hover:bg-white/20 transition-colors">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold">مشاهدة الفيديو</div>
              <div class="text-red-100 text-sm">اضغط للمشاهدة في نافذة منفصلة</div>
            </div>
          </div>
        </button>
      </div>`
    })

    processedContent = processedContent.replace(/!\[([^\]]*)\]$$([^)]+)$$/g, (match, alt, src) => {
      return `<img src="${src}" alt="${alt}" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg my-6 object-cover" loading="lazy" />`
    })

    marked.setOptions({
      highlight: (code, lang) => {
        const validLang = lang && lang.trim() ? lang.trim() : "text"
        const languageNames: { [key: string]: string } = {
          js: "JavaScript",
          javascript: "JavaScript",
          ts: "TypeScript",
          typescript: "TypeScript",
          py: "Python",
          python: "Python",
          java: "Java",
          cs: "C#",
          csharp: "C#",
          css: "CSS",
          html: "HTML",
          json: "JSON",
          sql: "SQL",
          jsx: "JSX",
          tsx: "TSX",
          bash: "Bash",
          php: "PHP",
          go: "Go",
          rust: "Rust",
          swift: "Swift",
          kotlin: "Kotlin",
          text: "نص",
        }

        const displayName = languageNames[validLang] || validLang.toUpperCase()
        const fileExtensions: { [key: string]: string } = {
          js: "js",
          javascript: "js",
          ts: "ts",
          typescript: "ts",
          py: "py",
          python: "py",
          java: "java",
          cs: "cs",
          csharp: "cs",
          css: "css",
          html: "html",
          json: "json",
          sql: "sql",
          jsx: "jsx",
          tsx: "tsx",
          bash: "sh",
          php: "php",
          go: "go",
          rust: "rs",
          swift: "swift",
          kotlin: "kt",
          text: "txt",
        }

        const extension = fileExtensions[validLang] || "txt"

        return `
          <div class="code-block-container">
            <div class="code-block-header">
              <div class="code-language-label">${displayName}</div>
              <div class="code-actions">
                <button class="code-action-btn code-copy-btn" onclick="copyCode(this)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  نسخ
                </button>
                <button class="code-action-btn code-download-btn" onclick="downloadCode(this, '${extension}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  تحميل
                </button>
              </div>
            </div>
            <pre class="language-${validLang}"><code class="language-${validLang}">${code}</code></pre>
          </div>
        `
      },
      breaks: true,
      gfm: true,
    })

    return { __html: marked(processedContent) }
  }

  useEffect(() => {
    const handleYouTubeClick = (e: Event) => {
      const target = e.target as HTMLElement
      const button = target.closest(".youtube-video-btn") as HTMLElement
      if (button) {
        const videoId = button.getAttribute("data-video-id")
        if (videoId) {
          openVideoModal(videoId)
        }
      }
    }

    document.addEventListener("click", handleYouTubeClick)
    return () => document.removeEventListener("click", handleYouTubeClick)
  }, [])

  useEffect(() => {
    ;(window as any).copyCode = (button: HTMLElement) => {
      const codeBlock = button.closest(".code-block-container")?.querySelector("code")
      if (codeBlock) {
        const code = codeBlock.textContent || ""
        navigator.clipboard
          .writeText(code)
          .then(() => {
            const originalText = button.innerHTML
            button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"></polyline></svg> تم النسخ!`
            button.style.background = "linear-gradient(135deg, #059669 0%, #047857 100%)"
            setTimeout(() => {
              button.innerHTML = originalText
              button.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            }, 2000)
          })
          .catch(() => {
            const textArea = document.createElement("textarea")
            textArea.value = code
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand("copy")
            document.body.removeChild(textArea)
          })
      }
    }
    ;(window as any).downloadCode = (button: HTMLElement, extension: string) => {
      const codeBlock = button.closest(".code-block-container")?.querySelector("code")
      if (codeBlock) {
        const code = codeBlock.textContent || ""
        const blob = new Blob([code], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `code.${extension}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        const originalText = button.innerHTML
        button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"></polyline></svg> تم التحميل!`
        button.style.background = "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
        setTimeout(() => {
          button.innerHTML = originalText
          button.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        }, 2000)
      }
    }

    const loadPrism = async () => {
      if (typeof window !== "undefined" && post) {
        try {
          const Prism = (await import("prismjs")).default

          await Promise.all(
            [
              import("prismjs/components/prism-javascript"),
              import("prismjs/components/prism-typescript"),
              import("prismjs/components/prism-python"),
              import("prismjs/components/prism-java"),
              import("prismjs/components/prism-css"),
              import("prismjs/components/prism-json"),
              import("prismjs/components/prism-csharp"),
              import("prismjs/components/prism-php"),
              import("prismjs/components/prism-go"),
              import("prismjs/components/prism-rust"),
              import("prismjs/components/prism-swift"),
              import("prismjs/components/prism-kotlin"),
              import("prismjs/components/prism-bash"),
              import("prismjs/components/prism-jsx"),
              import("prismjs/components/prism-tsx"),
            ].map((p) => p.catch(() => {})),
          )

          Prism.manual = true
          setTimeout(() => Prism.highlightAll(), 100)
        } catch (error) {
          console.error("Failed to load Prism:", error)
        }
      }
    }

    loadPrism()
  }, [post])

  const detectTitleDirection = (title: string, direction?: string) => {
    if (direction && direction !== "auto") return direction

    const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    return rtlRegex.test(title) ? "rtl" : "ltr"
  }

  const toHijriDate = (gregorianDate: Date) => {
    try {
      return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(gregorianDate)
    } catch {
      return null
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date)
  }

  const generateShareLink = () => {
    if (typeof window !== "undefined" && post) {
      return `${window.location.origin}/post/${post._id}`
    }
    return ""
  }

  const copyShareLink = async () => {
    const shareLink = generateShareLink()
    try {
      await navigator.clipboard.writeText(shareLink)
    } catch (err) {
      const textArea = document.createElement("textarea")
      textArea.value = shareLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  }

  const shareToSocial = (platform: string) => {
    if (!post) return

    const shareLink = generateShareLink()
    const text = `${post.title} - بواسطة ${post.author}`

    let url = ""
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`
        break
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`
        break
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareLink}`)}`
        break
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`
        break
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">خطأ</h1>
          <p className="text-gray-400 mb-6">{error || "المنشور غير موجود"}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    )
  }

  const postDate = new Date(post.createdAt)
  const hijriDate = toHijriDate(postDate)
  const titleDir = detectTitleDirection(post.title, post.titleDirection)

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      <header className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 shadow-2xl border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm p-3 rounded-xl transition-all duration-300 border border-gray-600/30 hover:border-gray-500/50"
            >
              <ArrowRight className="w-5 h-5" />
              <span>العودة للرئيسية</span>
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
                Just Programming
              </h1>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="bg-gray-700/50 hover:bg-blue-600/50 backdrop-blur-sm p-3 rounded-xl transition-all duration-300 border border-gray-600/30 hover:border-blue-500/50"
              title="مشاركة المنشور"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <article className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/30">
          <div className="p-6 md:p-8">
            <h1
              className="text-3xl md:text-4xl font-bold text-blue-400 mb-6"
              dir={titleDir}
              style={{ textAlign: titleDir === "rtl" ? "right" : "left" }}
            >
              {post.title}
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mb-8 rounded-full"></div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm mb-8">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <span className="font-medium">بواسطة: {post.author}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <div className="bg-green-600/20 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span>🌙</span>
                  <span>{hijriDate || postDate.toLocaleDateString("ar-SA")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <div className="bg-purple-600/20 p-2 rounded-lg">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <span>{formatTime(postDate)}</span>
              </div>
            </div>

            {post.media && (
              <div className="mb-8">
                <img
                  src={post.media || "/placeholder.svg"}
                  alt={post.title}
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>
            )}

            <div
              className="prose prose-invert prose-blue max-w-none prose-pre:bg-transparent prose-pre:border-0 prose-pre:p-0"
              dangerouslySetInnerHTML={renderContent(post.content)}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-gray-700/50">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm border border-blue-500/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      </main>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl aspect-video">
            <button
              onClick={closeVideoModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
                <h3 className="text-lg font-semibold text-white">مشاركة المنشور</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">{post.title}</h4>
                  <p className="text-xs text-gray-400">بواسطة {post.author}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl">
                    <Link className="w-4 h-4 text-blue-400" />
                    <input
                      type="text"
                      value={generateShareLink()}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-300 outline-none"
                    />
                    <button
                      onClick={copyShareLink}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => shareToSocial("whatsapp")}
                      className="flex items-center justify-center gap-2 p-3 bg-green-600/20 hover:bg-green-600/30 rounded-xl transition-colors border border-green-500/30"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      <span className="text-sm">واتساب</span>
                    </button>

                    <button
                      onClick={() => shareToSocial("telegram")}
                      className="flex items-center justify-center gap-2 p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl transition-colors border border-blue-500/30"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                      <span className="text-sm">تيليجرام</span>
                    </button>

                    <button
                      onClick={() => shareToSocial("twitter")}
                      className="flex items-center justify-center gap-2 p-3 bg-sky-600/20 hover:bg-sky-600/30 rounded-xl transition-colors border border-sky-500/30"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      <span className="text-sm">تويتر</span>
                    </button>

                    <button
                      onClick={() => shareToSocial("facebook")}
                      className="flex items-center justify-center gap-2 p-3 bg-blue-800/20 hover:bg-blue-800/30 rounded-xl transition-colors border border-blue-700/30"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span className="text-sm">فيسبوك</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800/50 backdrop-blur-sm mt-16 border-t border-gray-700/30">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-400">© 2025 Just Programming. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  )
}
