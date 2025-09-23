"use client"

import { useState, useRef, useEffect } from "react"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Undo,
  Redo,
  Youtube,
} from "lucide-react"

interface WYSIWYGEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function WYSIWYGEditor({ value, onChange, placeholder = "ابدأ الكتابة..." }: WYSIWYGEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
    editorRef.current?.focus()
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertLink = () => {
    const url = prompt("أدخل رابط URL:")
    if (url) {
      executeCommand("createLink", url)
    }
  }

  const insertImage = () => {
    const url = prompt("أدخل رابط الصورة:")
    if (url) {
      executeCommand("insertImage", url)
    }
  }

  const insertYouTubeVideo = () => {
    const url = prompt("أدخل رابط فيديو YouTube:")
    if (url) {
      // Extract video ID from various YouTube URL formats
      const videoIdMatch = url.match(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      )
      if (videoIdMatch) {
        const videoId = videoIdMatch[1]
        const embedHtml = `<div class="youtube-embed-container" style="margin: 20px 0; text-align: center;">
          <div style="background: linear-gradient(135deg, #ff0000, #cc0000); color: white; padding: 15px; border-radius: 10px; display: inline-block; cursor: pointer;" data-youtube-id="${videoId}">
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>فيديو YouTube - اضغط للمشاهدة</span>
            </div>
          </div>
        </div>`
        executeCommand("insertHTML", embedHtml)
      } else {
        alert("رابط YouTube غير صحيح. يرجى التأكد من الرابط.")
      }
    }
  }

  const insertCode = () => {
    const languages = [
      { value: "javascript", label: "JavaScript" },
      { value: "typescript", label: "TypeScript" },
      { value: "python", label: "Python" },
      { value: "java", label: "Java" },
      { value: "csharp", label: "C#" },
      { value: "css", label: "CSS" },
      { value: "html", label: "HTML" },
      { value: "json", label: "JSON" },
      { value: "sql", label: "SQL" },
      { value: "bash", label: "Bash" },
      { value: "php", label: "PHP" },
      { value: "go", label: "Go" },
      { value: "rust", label: "Rust" },
      { value: "text", label: "نص عادي" },
    ]

    const languageSelect = document.createElement("select")
    languageSelect.style.cssText =
      "padding: 8px; margin: 10px; background: #374151; color: white; border: 1px solid #6b7280; border-radius: 6px;"
    languages.forEach((lang) => {
      const option = document.createElement("option")
      option.value = lang.value
      option.textContent = lang.label
      languageSelect.appendChild(option)
    })

    const codeTextarea = document.createElement("textarea")
    codeTextarea.style.cssText =
      "width: 100%; height: 200px; padding: 10px; background: #1f2937; color: white; border: 1px solid #6b7280; border-radius: 6px; font-family: 'Courier New', monospace; resize: vertical;"
    codeTextarea.placeholder = "أدخل الكود هنا..."

    const modal = document.createElement("div")
    modal.style.cssText =
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;"

    const modalContent = document.createElement("div")
    modalContent.style.cssText =
      "background: #1f2937; padding: 20px; border-radius: 10px; width: 90%; max-width: 600px; color: white;"

    const title = document.createElement("h3")
    title.textContent = "إدراج كود"
    title.style.cssText = "margin: 0 0 15px 0; color: #60a5fa;"

    const langLabel = document.createElement("label")
    langLabel.textContent = "اختر لغة البرمجة:"
    langLabel.style.cssText = "display: block; margin-bottom: 5px; color: #d1d5db;"

    const buttons = document.createElement("div")
    buttons.style.cssText = "display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end;"

    const cancelBtn = document.createElement("button")
    cancelBtn.textContent = "إلغاء"
    cancelBtn.style.cssText =
      "padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;"

    const insertBtn = document.createElement("button")
    insertBtn.textContent = "إدراج"
    insertBtn.style.cssText =
      "padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;"

    modalContent.appendChild(title)
    modalContent.appendChild(langLabel)
    modalContent.appendChild(languageSelect)
    modalContent.appendChild(codeTextarea)
    buttons.appendChild(cancelBtn)
    buttons.appendChild(insertBtn)
    modalContent.appendChild(buttons)
    modal.appendChild(modalContent)
    document.body.appendChild(modal)

    codeTextarea.focus()

    cancelBtn.onclick = () => document.body.removeChild(modal)
    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal)
    }

    insertBtn.onclick = () => {
      const code = codeTextarea.value.trim()
      const language = languageSelect.value
      if (code) {
        const codeHtml = `<pre><code class="language-${language}">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`
        executeCommand("insertHTML", codeHtml)
      }
      document.body.removeChild(modal)
    }
  }

  const toolbarButtons = [
    { icon: Bold, command: "bold", title: "عريض" },
    { icon: Italic, command: "italic", title: "مائل" },
    { icon: Underline, command: "underline", title: "تحته خط" },
    { icon: Strikethrough, command: "strikeThrough", title: "يتوسطه خط" },
    { type: "separator" },
    { icon: Heading1, command: "formatBlock", value: "h1", title: "عنوان 1" },
    { icon: Heading2, command: "formatBlock", value: "h2", title: "عنوان 2" },
    { icon: Heading3, command: "formatBlock", value: "h3", title: "عنوان 3" },
    { type: "separator" },
    { icon: AlignLeft, command: "justifyLeft", title: "محاذاة يسار" },
    { icon: AlignCenter, command: "justifyCenter", title: "محاذاة وسط" },
    { icon: AlignRight, command: "justifyRight", title: "محاذاة يمين" },
    { type: "separator" },
    { icon: List, command: "insertUnorderedList", title: "قائمة نقطية" },
    { icon: ListOrdered, command: "insertOrderedList", title: "قائمة مرقمة" },
    { icon: Quote, command: "formatBlock", value: "blockquote", title: "اقتباس" },
    { type: "separator" },
    { icon: LinkIcon, action: insertLink, title: "إدراج رابط" },
    { icon: ImageIcon, action: insertImage, title: "إدراج صورة" },
    { icon: Youtube, action: insertYouTubeVideo, title: "إدراج فيديو YouTube" }, // Added YouTube button
    { icon: Code, action: insertCode, title: "إدراج كود" },
    { type: "separator" },
    { icon: Undo, command: "undo", title: "تراجع" },
    { icon: Redo, command: "redo", title: "إعادة" },
  ]

  return (
    <div className="wysiwyg-editor bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="toolbar bg-gray-900 border-b border-gray-700 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {toolbarButtons.map((button, index) => {
            if (button.type === "separator") {
              return <div key={index} className="w-px h-6 bg-gray-600 mx-2" />
            }

            const Icon = button.icon!
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (button.action) {
                    button.action()
                  } else {
                    executeCommand(button.command!, button.value)
                  }
                }}
                className="toolbar-btn flex items-center justify-center w-8 h-8 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                title={button.title}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        className={`editor-content min-h-[300px] p-4 text-white bg-gray-800 focus:outline-none ${
          !value && !isEditorFocused ? "text-gray-500" : ""
        }`}
        style={{ direction: "rtl" }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  )
}
