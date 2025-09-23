"use client"

import { useState, useEffect, useRef } from "react"
import { marked } from "marked"
import { Search, X, Settings, Share2, CheckCircle } from "lucide-react"
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

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  const [currentSharePost, setCurrentSharePost] = useState<Post | null>(null)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [selectedAuthor, setSelectedAuthor] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [showSidebar, setShowSidebar] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showAdminDropdown, setShowAdminDropdown] = useState(false)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [showSearchFilter, setShowSearchFilter] = useState(false)

  const adminDropdownRef = useRef<HTMLDivElement>(null)
  const shareModalRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const searchFilterRef = useRef<HTMLDivElement>(null)

  const allTags = [...new Set(posts.flatMap((post) => post.tags))]
  const allAuthors = [...new Set(posts.map((post) => post.author))]

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    let filtered = [...posts]

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedTag) {
      filtered = filtered.filter((post) => post.tags.includes(selectedTag))
    }

    if (selectedAuthor) {
      filtered = filtered.filter((post) => post.author === selectedAuthor)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "title":
          return a.title.localeCompare(b.title, "ar")
        default:
          return 0
      }
    })

    setFilteredPosts(filtered)
  }, [posts, searchTerm, selectedTag, selectedAuthor, sortBy])

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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (showAdminDropdown && adminDropdownRef.current && !adminDropdownRef.current.contains(target)) {
        setShowAdminDropdown(false)
      }

      if (showShareModal && shareModalRef.current && !shareModalRef.current.contains(target)) {
        closeShareModal()
      }

      if (showSidebar && sidebarRef.current && !sidebarRef.current.contains(target)) {
        setShowSidebar(false)
      }

      if (showSearchFilter && searchFilterRef.current && !searchFilterRef.current.contains(target)) {
        const toggleButton = document.querySelector(".search-filter-toggle")
        if (toggleButton && !toggleButton.contains(target)) {
          setShowSearchFilter(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showAdminDropdown, showShareModal, showSidebar, showSearchFilter])

  useEffect(() => {
    const loadPrism = async () => {
      if (typeof window !== "undefined" && filteredPosts.length > 0) {
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
  }, [filteredPosts])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts")
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      } else {
        setError("فشل في تحميل المقالات")
      }
    } catch (err) {
      setError("خطأ في الاتصال بالخادم")
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

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
        const currentIndex = filteredPosts.findIndex((post) => post._id === postId)
        const nextIndex = currentIndex + 1
        if (nextIndex < filteredPosts.length) {
          const nextPostId = filteredPosts[nextIndex]._id
          setTimeout(() => {
            const nextPostElement = document.querySelector(`[data-post-id="${nextPostId}"]`)
            if (nextPostElement) {
              nextPostElement.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          }, 100)
        }
      } else {
        newSet.add(postId)
      }
      return newSet
    })
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

    processedContent = processedContent.replace(
      /<div class="youtube-embed-container"[^>]*>[\s\S]*?data-youtube-id="([^"]+)"[\s\S]*?<\/div>/g,
      (match, videoId) => {
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
      },
    )

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
          csharp: "csharp",
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
      sanitize: false, // Allow HTML tags
      pedantic: false,
      smartLists: true,
      smartypants: false,
    })

    return { __html: marked(processedContent) }
  }

  const renderTitle = (title: string) => {
    const htmlTagRegex = /<[^>]+>/
    if (htmlTagRegex.test(title)) {
      return { __html: title }
    } else {
      const processedTitle = marked(title, {
        breaks: false,
        gfm: true,
        headerIds: false,
        mangle: false,
        sanitize: false, // Allow HTML in titles too
      })
      return { __html: processedTitle }
    }
  }

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

  const generateShareLink = (post: Post) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    return `${baseUrl}/post/${post._id}`
  }

  const openShareModal = (post: Post) => {
    setCurrentSharePost(post)
    setShowShareModal(true)
  }

  const closeShareModal = () => {
    setShowShareModal(false)
    setCurrentSharePost(null)
  }

  const copyShareLink = async (post: Post) => {
    const shareLink = generateShareLink(post)
    try {
      await navigator.clipboard.writeText(shareLink)
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 3000)
    } catch (err) {
      const textArea = document.createElement("textarea")
      textArea.value = shareLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 3000)
    }
  }

  const shareToSocial = (platform: string, post: Post) => {
    const shareLink = generateShareLink(post)
    const text = `${post.title} - بواسطة ${post.author}`

    let url = ""
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`
        break
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`
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

  const clearAllFilters = () => {
    setSearchTerm("")
    setSelectedTag("")
    setSelectedAuthor("")
    setSortBy("newest")
  }

  const hasActiveFilters = searchTerm || selectedTag || selectedAuthor || sortBy !== "newest"

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-400/20 mx-auto"></div>
          </div>
          <p className="text-lg animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white transition-all duration-300" dir="rtl">
      <button
        onClick={() => setShowSearchFilter(!showSearchFilter)}
        className={`search-filter-toggle ${showSearchFilter ? "active" : ""}`}
        title={showSearchFilter ? "إغلاق البحث والفلترة" : "فتح البحث والفلترة"}
      >
        {showSearchFilter ? <X className="w-6 h-6 text-white" /> : <Search className="w-6 h-6 text-white" />}
      </button>

      <div ref={searchFilterRef} className={`search-filter-sidebar ${showSearchFilter ? "" : "closed"}`}>
        <div className="search-filter-header">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            البحث والفلترة
          </h3>
          <input
            type="text"
            placeholder="ابحث في المقالات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="filter-section">
            <label className="filter-label">الفئات</label>
            <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="filter-select">
              <option value="">جميع الفئات</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">المؤلف</label>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="filter-select"
            >
              <option value="">جميع المؤلفين</option>
              {allAuthors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">ترتيب حسب</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="title">العنوان</option>
            </select>
          </div>

          <div className="filter-section">
            <button onClick={clearAllFilters} disabled={!hasActiveFilters} className="clear-filters-btn">
              مسح جميع الفلاتر
            </button>

            <div className="filter-results-count">
              {filteredPosts.length} من {posts.length} مقالة
            </div>
          </div>
        </div>
      </div>

      {showCopyToast && (
        <div className="fixed top-6 right-6 z-[10000] bg-green-600/90 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-2xl border border-green-500/30 flex items-center gap-3 animate-in slide-in-from-top-2 duration-500 transform">
          <CheckCircle className="w-5 h-5 animate-bounce" />
          <span className="font-medium">تم نسخ رابط المنشور بنجاح!</span>
        </div>
      )}

      <header className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 shadow-2xl border-b border-gray-700 transition-all duration-500">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-in fade-in-0 duration-1000">
                Just Programming
              </h1>
              <div className="relative mx-auto w-48 h-2 mt-4 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 rounded-full animate-in slide-in-from-left-5 duration-1000 delay-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full animate-ping opacity-30"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 rounded-full blur-sm animate-pulse"></div>
              </div>
              <p className="text-gray-300 mt-3 text-xl font-medium animate-in fade-in-0 duration-1000 delay-500">
                مدونة البرمجة العربية
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Admin Panel Dropdown */}
              <div className="relative" ref={adminDropdownRef}>
                <button
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                  className="bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm p-3 rounded-xl transition-all duration-300 flex items-center justify-center border border-gray-600/30 hover:border-gray-500/50 shadow-lg transform hover:scale-105"
                  title="خيارات المطور"
                >
                  <Settings
                    className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${showAdminDropdown ? "rotate-90" : ""}`}
                  />
                </button>

                {showAdminDropdown && (
                  <div className="absolute top-full left-0 mt-3 w-64 bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 z-20 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-700/30 to-gray-800/30">
                      <h3 className="text-sm font-semibold text-white">لوحة المطور</h3>
                      <button
                        onClick={() => setShowAdminDropdown(false)}
                        className="text-gray-400 hover:text-white transition-all duration-200 p-1 rounded-lg hover:bg-gray-700/50 hover:rotate-90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="py-3">
                      <button
                        onClick={() => {
                          setShowAdminPanel(true)
                          setShowAdminDropdown(false)
                        }}
                        className="w-full text-right px-5 py-4 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 flex items-center gap-3 transform hover:translate-x-1"
                      >
                        <Settings className="w-4 h-4" />
                        <span>لوحة المطور المنبثقة</span>
                      </button>
                      <button
                        onClick={() => {
                          window.open("/admin", "_blank")
                          setShowAdminDropdown(false)
                        }}
                        className="w-full text-right px-5 py-4 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 flex items-center gap-3 transform hover:translate-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <span>اللوحة الخارجية</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 text-center animate-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        {filteredPosts.length === 0 && !error ? (
          <div className="text-center py-16 animate-in fade-in-0 duration-500">
            <div className="bg-gray-800/50 rounded-2xl p-12 max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl text-gray-300 mb-4 font-semibold">
                {posts.length === 0 ? "لا توجد مقالات حالياً" : "لا توجد نتائج مطابقة"}
              </h2>
              <p className="text-gray-500">
                {posts.length === 0 ? "سيتم نشر المقالات قريباً" : "جرب تغيير معايير البحث أو الفلترة"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:gap-12">
            {filteredPosts.map((post, index) => {
              const postDate = new Date(post.createdAt)
              const hijriDate = toHijriDate(postDate)
              const titleDir = detectTitleDirection(post.title, post.titleDirection)
              const isExpanded = expandedPosts.has(post._id)

              return (
                <article
                  key={post._id}
                  data-post-id={post._id}
                  className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/30 relative transform hover:scale-[1.02] transition-all duration-500 hover:shadow-3xl animate-in slide-in-from-bottom-3 duration-700`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <button
                    onClick={() => openShareModal(post)}
                    className="absolute top-4 left-4 bg-gray-700/80 hover:bg-blue-600/80 backdrop-blur-sm p-2 rounded-lg transition-all duration-300 z-10 border border-gray-600/30 hover:border-blue-500/50 transform hover:scale-110 hover:rotate-12"
                    title="مشاركة المنشور"
                  >
                    <Share2 className="w-4 h-4 text-gray-300 hover:text-white transition-colors duration-200" />
                  </button>

                  <div className="p-6 md:p-8">
                    <h2
                      className="post-title text-2xl md:text-3xl font-bold text-blue-400 mb-4 hover:text-blue-300 transition-colors duration-300 relative"
                      dir={titleDir}
                      style={{ textAlign: titleDir === "rtl" ? "right" : "left" }}
                      dangerouslySetInnerHTML={renderTitle(post.title)}
                    />

                    <div className="flex items-center justify-between mb-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{post.author.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{post.author}</p>
                          <p className="text-gray-400 text-sm">الكاتب</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-gray-300 font-medium">{formatTime(postDate)}</p>
                        <p className="text-gray-400 text-sm">{hijriDate || postDate.toLocaleDateString("ar-SA")}</p>
                      </div>
                    </div>

                    <div className="relative w-20 h-1 mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"></div>
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-sm"></div>
                    </div>

                    {post.media && (
                      <div className="mb-6">
                        <img
                          src={post.media || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-64 object-cover rounded-xl transform hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    {!isExpanded ? (
                      /* Created professional centered button for viewing full article */
                      <div className="flex justify-center mb-6">
                        <button
                          onClick={() => togglePostExpansion(post._id)}
                          className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-blue-500/30 hover:border-blue-400/50"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                          <div className="relative flex items-center gap-3">
                            <svg
                              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12H3m0 0l6-6m-6 6l6 6"
                              />
                            </svg>
                            <span className="text-lg">عرض المقال كاملاً</span>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <div
                          className="prose prose-invert prose-blue max-w-none prose-pre:bg-transparent prose-pre:border-0 prose-pre:p-0"
                          dangerouslySetInnerHTML={renderContent(post.content)}
                        />
                        <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-center">
                          <button
                            onClick={() => togglePostExpansion(post._id)}
                            className="group px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-300 border border-gray-600/30 hover:border-gray-500/50"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              <span>إخفاء المقال</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-700/50">
                        {post.tags.map((tag, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedTag(tag)}
                            className="bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white px-4 py-2 rounded-full text-sm transition-all duration-300 cursor-pointer border border-blue-500/30 hover:border-blue-500 transform hover:scale-110"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <footer className="bg-gray-800/50 backdrop-blur-sm mt-16 border-t border-gray-700/30 animate-in slide-in-from-bottom-3 duration-500">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-400">© 2025 Just Programming. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  )
}
