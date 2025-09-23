"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Plus, Edit, Save, Eye, Settings, LogOut } from "lucide-react"
import WYSIWYGEditor from "./wysiwyg-editor"
import AdminLogin from "./admin-login"

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface PostForm {
  title: string
  content: string
  author: string
  tags: string
  media?: string
}

interface PublishedPost {
  _id: string
  title: string
  content: string
  author: string
  tags: string[]
  media?: string
  createdAt: string
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [activeTab, setActiveTab] = useState<"create" | "manage">("create")
  const [postForm, setPostForm] = useState<PostForm>({
    title: "",
    content: "",
    author: "",
    tags: "",
    media: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [editingPost, setEditingPost] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (token) {
      // Verify token with server
      fetch("/api/admin/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setIsAuthenticated(data.valid)
          setCheckingAuth(false)
          if (data.valid && activeTab === "manage") {
            fetchPublishedPosts()
          }
        })
        .catch(() => {
          localStorage.removeItem("adminToken")
          setIsAuthenticated(false)
          setCheckingAuth(false)
        })
    } else {
      setCheckingAuth(false)
    }
  }, [isOpen, activeTab])

  useEffect(() => {
    if (activeTab === "manage" && isAuthenticated) {
      fetchPublishedPosts()
    }
  }, [activeTab, isAuthenticated])

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success)
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    setIsAuthenticated(false)
    onClose()
  }

  const fetchPublishedPosts = async () => {
    setLoadingPosts(true)
    try {
      const response = await fetch("/api/posts")
      if (response.ok) {
        const posts = await response.json()
        setPublishedPosts(posts)
      } else {
        console.error("[v0] Failed to fetch posts:", response.status)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المقال؟")) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setMessage({ type: "success", text: "تم حذف المقال بنجاح!" })
        fetchPublishedPosts()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: "فشل في حذف المقال" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "خطأ في الاتصال بالخادم" })
    }
  }

  const handleEditPost = (post: PublishedPost) => {
    setPostForm({
      title: post.title,
      content: post.content,
      author: post.author,
      tags: post.tags.join(", "),
      media: post.media || "",
    })
    setEditingPost(post._id)
    setActiveTab("create")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const token = localStorage.getItem("adminToken")
      console.log("[v0] Token from localStorage:", token ? "Present" : "Missing")

      if (!token) {
        setMessage({ type: "error", text: "جلسة منتهية الصلاحية - يرجى تسجيل الدخول مرة أخرى" })
        setIsAuthenticated(false)
        return
      }

      const url = editingPost ? `/api/posts/${editingPost}` : "/api/posts"
      const method = editingPost ? "PUT" : "POST"

      console.log("[v0] Submitting post:", { url, method, postForm })
      console.log("[v0] Authorization header will be:", `Bearer ${token.substring(0, 20)}...`)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...postForm,
          tags: postForm.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        }),
      })

      const responseData = await response.json()
      console.log("[v0] Response:", response.status, responseData)

      if (response.ok) {
        setMessage({
          type: "success",
          text: editingPost ? "تم تحديث المقال بنجاح!" : "تم نشر المقال بنجاح!",
        })
        setPostForm({ title: "", content: "", author: "", tags: "", media: "" })
        setEditingPost(null)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        let errorMessage = "فشل في حفظ المقال"
        if (response.status === 401) {
          errorMessage = "جلسة منتهية الصلاحية - يرجى تسجيل الدخول مرة أخرى"
          setIsAuthenticated(false)
          localStorage.removeItem("adminToken")
        } else if (responseData.details) {
          errorMessage = `خطأ: ${responseData.details}`
        }
        setMessage({ type: "error", text: errorMessage })
      }
    } catch (error) {
      console.error("[v0] Submit error:", error)
      setMessage({ type: "error", text: "خطأ في الاتصال بالخادم - تحقق من اتصال الإنترنت" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreview = () => {
    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>معاينة المقال</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { background: #111827; color: #f3f4f6; font-family: system-ui, sans-serif; }
            .content { max-width: 800px; margin: 2rem auto; padding: 2rem; }
            .content h1, .content h2, .content h3 { color: #60a5fa; }
            .content p { margin: 1rem 0; line-height: 1.7; }
            .content ul, .content ol { margin: 1rem 0; padding-right: 2rem; }
            .content blockquote { border-right: 4px solid #60a5fa; padding-right: 1rem; margin: 1rem 0; font-style: italic; }
            .content code { background: #374151; color: #10b981; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
            .content img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <div class="content">
            <h1 class="text-3xl font-bold mb-4">${postForm.title}</h1>
            <div class="text-gray-400 mb-6">بواسطة: ${postForm.author}</div>
            ${postForm.media ? `<img src="${postForm.media}" alt="${postForm.title}" class="w-full mb-6">` : ""}
            <div class="prose">${postForm.content}</div>
            <div class="mt-6 flex flex-wrap gap-2">
              ${postForm.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag)
                .map((tag) => `<span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">#${tag}</span>`)
                .join("")}
            </div>
          </div>
        </body>
        </html>
      `)
      previewWindow.document.close()
    }
  }

  if (!isOpen) return null

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} onClose={onClose} />
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="admin-panel w-full max-w-6xl max-h-[90vh] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="admin-panel-header p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">لوحة المطور</h2>
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "create" ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white"
                }`}
              >
                <Plus className="w-4 h-4 inline ml-2" />
                إنشاء مقال
              </button>
              <button
                onClick={() => setActiveTab("manage")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "manage" ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white"
                }`}
              >
                <Edit className="w-4 h-4 inline ml-2" />
                إدارة المقالات
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-700"
              title="تسجيل خروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {activeTab === "create" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-600/20 border border-green-600/30 text-green-400"
                      : "bg-red-600/20 border border-red-600/30 text-red-400"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {editingPost && (
                <div className="bg-blue-600/20 border border-blue-600/30 text-blue-400 p-4 rounded-lg flex items-center justify-between">
                  <span>جاري تعديل المقال</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(null)
                      setPostForm({ title: "", content: "", author: "", tags: "", media: "" })
                    }}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    إلغاء التعديل
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="admin-form-group">
                  <label className="admin-form-label">عنوان المقال</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="admin-form-input"
                    placeholder="أدخل عنوان المقال..."
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">الكاتب</label>
                  <input
                    type="text"
                    value={postForm.author}
                    onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                    className="admin-form-input"
                    placeholder="اسم الكاتب..."
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">رابط الصورة (اختياري)</label>
                <input
                  type="url"
                  value={postForm.media}
                  onChange={(e) => setPostForm({ ...postForm, media: e.target.value })}
                  className="admin-form-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">التاجات (مفصولة بفواصل)</label>
                <input
                  type="text"
                  value={postForm.tags}
                  onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                  className="admin-form-input"
                  placeholder="JavaScript, React, برمجة"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">محتوى المقال</label>
                <WYSIWYGEditor
                  value={postForm.content}
                  onChange={(content) => setPostForm({ ...postForm, content })}
                  placeholder="ابدأ كتابة المقال هنا... يمكنك استخدام HTML وMarkdown"
                />
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="admin-btn admin-btn-secondary flex items-center gap-2"
                  disabled={!postForm.title || !postForm.content}
                >
                  <Eye className="w-4 h-4" />
                  معاينة
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="admin-btn admin-btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "جاري الحفظ..." : editingPost ? "تحديث المقال" : "نشر المقال"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "manage" && (
            <div className="space-y-6">
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-600/20 border border-green-600/30 text-green-400"
                      : "bg-red-600/20 border border-red-600/30 text-red-400"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">المقالات المنشورة</h3>
                <button
                  onClick={fetchPublishedPosts}
                  className="admin-btn admin-btn-secondary text-sm"
                  disabled={loadingPosts}
                >
                  {loadingPosts ? "جاري التحديث..." : "تحديث"}
                </button>
              </div>

              {loadingPosts ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">جاري تحميل المقالات...</p>
                </div>
              ) : publishedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Edit className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-400 mb-2">لا توجد مقالات منشورة</h3>
                  <p className="text-gray-500">ابدأ بإنشاء مقال جديد</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {publishedPosts.map((post) => (
                    <div key={post._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-2">{post.title}</h4>
                          <p className="text-gray-400 text-sm mb-2">بواسطة: {post.author}</p>
                          <p className="text-gray-500 text-sm">
                            تاريخ النشر: {new Date(post.createdAt).toLocaleDateString("ar-EG")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            حذف
                          </button>
                        </div>
                      </div>

                      {post.media && (
                        <img
                          src={post.media || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                      )}

                      <div className="text-gray-300 text-sm mb-4 line-clamp-3">
                        <div dangerouslySetInnerHTML={{ __html: post.content.substring(0, 200) + "..." }} />
                      </div>

                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag, index) => (
                            <span key={index} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
