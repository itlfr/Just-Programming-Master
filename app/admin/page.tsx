"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { marked } from "marked"

interface Post {
  _id?: string
  title: string
  content: string
  author: string
  tags: string[]
  media?: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [newPost, setNewPost] = useState<Post>({
    title: "",
    content: "",
    author: "",
    tags: [],
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check")
      if (response.ok) {
        setIsAuthenticated(true)
        fetchPosts()
      }
    } catch (err) {
      console.log("Not authenticated")
    }
  }

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setMessage("تم تسجيل الدخول بنجاح")
        fetchPosts()
      } else {
        setMessage("كلمة المرور غير صحيحة")
      }
    } catch (err) {
      setMessage("خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        setIsAuthenticated(false)
        setMessage("تم تسجيل الخروج بنجاح")
        setPosts([])
        setEditingPost(null)
        setNewPost({ title: "", content: "", author: "", tags: [] })
      }
    } catch (err) {
      setMessage("خطأ في تسجيل الخروج")
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts")
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (err) {
      setMessage("فشل في تحميل المقالات")
    }
  }

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const postData = editingPost || newPost
    const url = editingPost ? `/api/posts/${editingPost._id}` : "/api/posts"
    const method = editingPost ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...postData,
          tags: typeof postData.tags === "string" ? postData.tags.split(",").map((tag) => tag.trim()) : postData.tags,
        }),
      })

      if (response.ok) {
        setMessage(editingPost ? "تم تحديث المقال" : "تم إنشاء المقال")
        setEditingPost(null)
        setNewPost({ title: "", content: "", author: "", tags: [] })
        fetchPosts()
      } else {
        setMessage("فشل في حفظ المقال")
      }
    } catch (err) {
      setMessage("خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المقال؟")) return

    try {
      const response = await fetch(`/api/posts/${id}`, { method: "DELETE" })
      if (response.ok) {
        setMessage("تم حذف المقال")
        fetchPosts()
      } else {
        setMessage("فشل في حذف المقال")
      }
    } catch (err) {
      setMessage("خطأ في الاتصال")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setMessage("حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        let markdownContent = ""

        if (file.type.startsWith("image/")) {
          markdownContent = `![${file.name}](${data.url})`
        } else if (file.type.startsWith("video/")) {
          markdownContent = `<video controls width="100%" class="rounded-lg my-4">
  <source src="${data.url}" type="${file.type}">
  متصفحك لا يدعم تشغيل الفيديو.
</video>`
        } else {
          markdownContent = `[${file.name}](${data.url})`
        }

        const currentContent = editingPost ? editingPost.content : newPost.content
        const newContent = currentContent + "\n\n" + markdownContent

        if (editingPost) {
          setEditingPost({ ...editingPost, content: newContent })
        } else {
          setNewPost({ ...newPost, content: newContent })
        }

        setMessage("تم رفع الملف بنجاح")
        e.target.value = ""
      } else {
        const errorData = await response.json()
        setMessage(`فشل في رفع الملف: ${errorData.error}`)
      }
    } catch (err) {
      console.error("Upload error:", err)
      setMessage("خطأ في رفع الملف")
    } finally {
      setUploading(false)
    }
  }

  const insertYouTubeVideo = () => {
    if (!youtubeUrl) return

    const videoId = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
    if (!videoId) {
      setMessage("رابط يوتيوب غير صحيح")
      return
    }

    const embedCode = `\n\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>\n\n`

    const currentContent = editingPost ? editingPost.content : newPost.content
    const newContent = currentContent + embedCode

    if (editingPost) {
      setEditingPost({ ...editingPost, content: newContent })
    } else {
      setNewPost({ ...newPost, content: newContent })
    }

    setYoutubeUrl("")
    setMessage("تم إدراج فيديو يوتيوب")
  }

  const renderPreview = (content: string) => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g
    let processedContent = content.replace(youtubeRegex, (match, videoId) => {
      return `<div class="youtube-embed my-6"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen class="w-full h-64 md:h-80 rounded-lg"></iframe></div>`
    })

    processedContent = processedContent.replace(/!\[([^\]]*)\]$$([^)]+)$$/g, (match, alt, src) => {
      return `<img src="${src}" alt="${alt}" class="w-full max-w-2xl mx-auto rounded-lg shadow-lg my-6" />`
    })

    return { __html: marked(processedContent) }
  }

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const currentContent = editingPost ? editingPost.content : newPost.content
    const newContent = currentContent + syntax.replace("{text}", placeholder)

    if (editingPost) {
      setEditingPost({ ...editingPost, content: newContent })
    } else {
      setNewPost({ ...newPost, content: newContent })
    }
  }

  const markdownButtons = [
    { label: "عنوان كبير", syntax: "\n# {text}\n", placeholder: "العنوان الرئيسي" },
    { label: "عنوان فرعي", syntax: "\n## {text}\n", placeholder: "العنوان الفرعي" },
    { label: "نص عريض", syntax: "**{text}**", placeholder: "نص عريض" },
    { label: "نص مائل", syntax: "*{text}*", placeholder: "نص مائل" },
    { label: "كود", syntax: "`{text}`", placeholder: "الكود" },
    { label: "رابط", syntax: "[{text}](URL)", placeholder: "نص الرابط" },
    { label: "قائمة", syntax: "\n- {text}\n- عنصر ثاني\n- عنصر ثالث\n", placeholder: "عنصر أول" },
    { label: "اقتباس", syntax: "\n> {text}\n", placeholder: "النص المقتبس" },
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center" dir="rtl">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-blue-400">لوحة التحكم - Just Programming</h1>

          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          {message && <div className="mt-4 p-3 bg-red-600 text-white rounded-lg text-center">{message}</div>}
        </div>
      </div>
    )
  }

  const currentPost = editingPost || newPost

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-blue-400">لوحة التحكم - Just Programming</h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {message && <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center">{message}</div>}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Post Form */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-400">{editingPost ? "تعديل المقال" : "مقال جديد"}</h2>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                {showPreview ? "إخفاء المعاينة" : "معاينة"}
              </button>
            </div>

            {showPreview && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg border-2 border-purple-500">
                <h3 className="text-lg font-bold text-purple-400 mb-4">معاينة المقال</h3>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <h2 className="text-2xl font-bold text-blue-400 mb-4">{currentPost.title || "عنوان المقال"}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    <span>بواسطة: {currentPost.author || "الكاتب"}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString("ar-SA")}</span>
                  </div>
                  <div
                    className="prose prose-invert prose-blue max-w-none"
                    dangerouslySetInnerHTML={renderPreview(currentPost.content)}
                  />
                  {currentPost.tags && currentPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {currentPost.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={savePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">العنوان</label>
                <input
                  type="text"
                  value={currentPost.title}
                  onChange={(e) =>
                    editingPost
                      ? setEditingPost({ ...editingPost, title: e.target.value })
                      : setNewPost({ ...newPost, title: e.target.value })
                  }
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الكاتب</label>
                <input
                  type="text"
                  value={currentPost.author}
                  onChange={(e) =>
                    editingPost
                      ? setEditingPost({ ...editingPost, author: e.target.value })
                      : setNewPost({ ...newPost, author: e.target.value })
                  }
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">العلامات (مفصولة بفواصل)</label>
                <input
                  type="text"
                  value={Array.isArray(currentPost.tags) ? currentPost.tags.join(", ") : currentPost.tags}
                  onChange={(e) =>
                    editingPost
                      ? setEditingPost({ ...editingPost, tags: e.target.value.split(",").map((tag) => tag.trim()) })
                      : setNewPost({ ...newPost, tags: e.target.value.split(",").map((tag) => tag.trim()) })
                  }
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="JavaScript, React, برمجة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">المحتوى (Markdown)</label>

                <div className="mb-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">أدوات التنسيق:</div>
                  <div className="flex flex-wrap gap-2">
                    {markdownButtons.map((button, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertMarkdown(button.syntax, button.placeholder)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                        title={`إدراج ${button.label}`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={currentPost.content}
                  onChange={(e) =>
                    editingPost
                      ? setEditingPost({ ...editingPost, content: e.target.value })
                      : setNewPost({ ...newPost, content: e.target.value })
                  }
                  rows={12}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="اكتب محتوى المقال هنا باستخدام Markdown..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">رفع صورة أو فيديو</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    disabled={uploading}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  {uploading && <p className="text-sm text-blue-400 mt-1">جاري الرفع...</p>}
                  <p className="text-xs text-gray-400 mt-1">الحد الأقصى: 10 ميجابايت</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">رابط يوتيوب (اختياري)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={insertYouTubeVideo}
                      disabled={!youtubeUrl}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                    >
                      إدراج
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? "جاري الحفظ..." : editingPost ? "تحديث" : "نشر"}
                </button>

                {editingPost && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(null)
                      setNewPost({ title: "", content: "", author: "", tags: [] })
                    }}
                    className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">المقالات المنشورة</h2>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {posts.map((post) => (
                <div key={post._id} className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-300 mb-2">{post.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">بواسطة: {post.author}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPost(post)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => post._id && deletePost(post._id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}

              {posts.length === 0 && <p className="text-gray-400 text-center py-8">لا توجد مقالات</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
