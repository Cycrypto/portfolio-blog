"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, JSONContent, useEditor } from "@tiptap/react"
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus"
import { getEditorExtensions } from "@/lib/tiptap/editor-extensions"
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Strikethrough,
  Underline,
  Highlighter,
  Palette,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  PlusSquare,
  Video,
} from "lucide-react"
import { uploadMedia } from "@/lib/api"

interface TiptapEditorProps {
  content: JSONContent | null
  onChange: (json: JSONContent) => void
  className?: string
}

export function TiptapEditor({ content, onChange, className = "" }: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const colorPickerRef = useRef<HTMLDivElement | null>(null)
  const highlightPickerRef = useRef<HTMLDivElement | null>(null)
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: content || undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "notion-content focus:outline-none",
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find((item) => item.type.indexOf("image") !== -1)

        if (imageItem) {
          event.preventDefault()
          const file = imageItem.getAsFile()
          if (file) {
            addUploadedImage(file)
          }
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getJSON())
    },
  })

  const setLink = () => {
    if (!editor) {
      return
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("URL", previousUrl || "")

    if (url === null) {
      return
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const addImage = () => {
    if (!editor) {
      return
    }

    const url = window.prompt("Image URL")
    if (!url) {
      return
    }

    editor.chain().focus().setImage({ src: url }).run()
  }

  const addUploadedImage = async (file: File) => {
    if (!editor) {
      return
    }

    try {
      setIsUploading(true)

      // 파일을 base64로 변환하여 에디터에 직접 삽입
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        if (base64) {
          editor.chain().focus().setImage({ src: base64 }).run()
        }
        setIsUploading(false)
      }
      reader.onerror = () => {
        console.error("이미지 읽기 실패")
        alert("이미지를 읽는데 실패했습니다.")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("이미지 처리 실패", error)
      alert("이미지 처리에 실패했습니다.")
      setIsUploading(false)
    }
  }

  const insertTable = () => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const addMath = () => {
    if (!editor) return
    const latex = window.prompt("LaTeX 수식을 입력하세요 (예: E = mc^2)")
    if (!latex) return
    editor.chain().focus().setMathInline({ latex }).run()
  }

  const addYoutube = () => {
    if (!editor) return
    const url = window.prompt("YouTube URL을 입력하세요")
    if (!url) return
    editor.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  const textColors = [
    "#000000", "#374151", "#dc2626", "#ea580c", "#d97706", "#ca8a04",
    "#65a30d", "#16a34a", "#059669", "#0891b2", "#0284c7", "#2563eb",
    "#4f46e5", "#7c3aed", "#9333ea", "#c026d3", "#db2777", "#e11d48",
  ]

  const highlightColors = [
    "transparent", "#fef3c7", "#fecaca", "#fed7aa", "#fde68a", "#fef08a",
    "#d9f99d", "#bbf7d0", "#a7f3d0", "#99f6e4", "#a5f3fc", "#bfdbfe",
    "#c7d2fe", "#ddd6fe", "#e9d5ff", "#f3e8ff", "#fce7f3", "#fecdd3",
  ]

  useEffect(() => {
    if (!editor || !content) {
      return
    }

    const currentContent = editor.getJSON()
    if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(event.target as Node)) {
        setShowHighlightPicker(false)
      }
    }

    if (showColorPicker || showHighlightPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showColorPicker, showHighlightPicker])

  if (!editor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">
        에디터를 불러오는 중...
      </div>
    )
  }

  return (
    <div className={`notion-shell ${className}`}>
      <div className="notion-toolbar">
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="굵게 (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="기울임 (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="취소선"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="인라인 코드"
        >
          <Code2 className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="제목 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="제목 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="불릿 리스트"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="번호 리스트"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="체크리스트"
        >
          <ListTodo className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="인용구"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("link")}
          onClick={setLink}
          title="링크"
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="이미지 업로드"
        >
          <Image className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              addUploadedImage(file)
            }
            event.currentTarget.value = ""
          }}
        />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <div className="relative">
          <button
            type="button"
            className="notion-toolbar-button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="텍스트 색상"
          >
            <Palette className="h-4 w-4" />
          </button>
          {showColorPicker && (
            <div
              ref={colorPickerRef}
              className="absolute top-full mt-2 p-2 bg-white rounded-lg shadow-lg border border-brand-indigo-500 z-50"
              style={{ minWidth: "200px" }}
            >
              <div className="grid grid-cols-6 gap-1">
                {textColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-brand-indigo-500 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor?.chain().focus().setColor(color).run()
                      setShowColorPicker(false)
                    }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                className="mt-2 w-full text-xs text-gray-600 hover:text-gray-900 py-1"
                onClick={() => {
                  editor?.chain().focus().unsetColor().run()
                  setShowColorPicker(false)
                }}
              >
                색상 제거
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            className="notion-toolbar-button"
            data-active={editor.isActive("highlight")}
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            title="형광펜"
          >
            <Highlighter className="h-4 w-4" />
          </button>
          {showHighlightPicker && (
            <div
              ref={highlightPickerRef}
              className="absolute top-full mt-2 p-2 bg-white rounded-lg shadow-lg border border-brand-indigo-500 z-50"
              style={{ minWidth: "200px" }}
            >
              <div className="grid grid-cols-6 gap-1">
                {highlightColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-brand-indigo-500 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (color === "transparent") {
                        editor?.chain().focus().unsetHighlight().run()
                      } else {
                        editor?.chain().focus().setHighlight({ color }).run()
                      }
                      setShowHighlightPicker(false)
                    }}
                    title={color === "transparent" ? "하이라이트 제거" : color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          className="notion-toolbar-button"
          onClick={insertTable}
          title="표 삽입"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="왼쪽 정렬"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="가운데 정렬"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="오른쪽 정렬"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="양쪽 정렬"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          className="notion-toolbar-button"
          onClick={addMath}
          title="수식 삽입"
        >
          <PlusSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          onClick={addYoutube}
          title="YouTube 삽입"
        >
          <Video className="h-4 w-4" />
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs text-neutral-slate-500">
          <span>마크다운 문법도 사용 가능</span>
        </div>
      </div>
      <BubbleMenu editor={editor}>
        <div className="notion-bubble-menu">
          <button
            type="button"
            data-active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="notion-menu-button"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="notion-menu-button"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className="notion-menu-button"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className="notion-menu-button"
          >
            <Code2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-active={editor.isActive("link")}
            onClick={setLink}
            className="notion-menu-button"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      </BubbleMenu>

      <FloatingMenu
        editor={editor}
        shouldShow={({ state }) => {
          const { $from } = state.selection
          const isTextEmpty = $from.parent.textContent.length === 0
          return isTextEmpty && editor.isEditable
        }}
      >
        <div className="notion-floating-menu">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="notion-menu-button"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="notion-menu-button"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="notion-menu-button"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="notion-menu-button"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className="notion-menu-button"
          >
            <ListTodo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="notion-menu-button"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="notion-menu-button"
          >
            <Code2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="notion-menu-button"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={addImage}
            className="notion-menu-button"
          >
            <Image className="h-4 w-4" />
          </button>
        </div>
      </FloatingMenu>

      <EditorContent editor={editor} />
    </div>
  )
}
