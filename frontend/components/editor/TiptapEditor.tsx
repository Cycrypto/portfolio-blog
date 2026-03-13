"use client"

import type { Editor } from "@tiptap/core"
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, JSONContent, useEditor } from "@tiptap/react"
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus"
import { CellSelection } from "@tiptap/pm/tables"
import { Button } from "@/components/ui/button"
import { BlockHandleMenu } from "@/components/editor/BlockHandleMenu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { EditorCommandPalette } from "@/components/editor/EditorCommandPalette"
import { SlashCommandMenu } from "@/components/editor/SlashCommandMenu"
import { uploadMedia } from "@/lib/api"
import {
  EDITOR_ACTIONS,
  EditorAction,
  EditorDocumentActions,
  filterEditorActions,
  getActionsForSurface,
  InsertDialogMode,
} from "@/lib/tiptap/editor-actions"
import {
  canTransformTopLevelBlock,
  deleteTopLevelBlock,
  duplicateTopLevelBlock,
  focusAfterTopLevelBlock,
  focusTopLevelBlock,
  getTopLevelBlockFromTarget,
  insertParagraphBelowTopLevelBlock,
} from "@/lib/tiptap/block-helpers"
import type { TopLevelBlockRange } from "@/lib/tiptap/block-helpers"
import { getEditorExtensions } from "@/lib/tiptap/editor-extensions"
import {
  COLUMN_WIDTH_STEP,
  MAX_COLUMN_WIDTH,
  MAX_ROW_HEIGHT,
  MIN_COLUMN_WIDTH,
  MIN_ROW_HEIGHT,
  ROW_HEIGHT_STEP,
  getTableSelectionState,
  setCurrentColumnWidth,
  setCurrentRowHeight,
} from "@/lib/tiptap/table-controls"
import { normalizeUrl } from "@/lib/utils/url"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Highlighter,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Palette,
  PlusSquare,
  Quote,
  Strikethrough,
  Table as TableIcon,
  Video,
} from "lucide-react"

interface TiptapEditorProps {
  className?: string
  content: JSONContent | null
  documentActions?: EditorDocumentActions
  onChange: (json: JSONContent) => void
  onError?: (message: string) => void
  onUploadStateChange?: (isUploading: boolean) => void
}

interface SlashCommandState {
  blockText: string
  from: number
  query: string
  to: number
}

interface HoveredBlockState {
  block: TopLevelBlockRange
  top: number
}

const BLOCK_TRANSFORM_ACTION_IDS = new Set([
  "paragraph",
  "heading-1",
  "heading-2",
  "bullet-list",
  "ordered-list",
  "task-list",
  "blockquote",
  "code-block",
  "align-left",
  "align-center",
  "align-right",
  "align-justify",
])

const INSERT_DIALOG_COPY: Record<
  InsertDialogMode,
  { title: string; description: string; placeholder: string; submitLabel: string }
> = {
  image: {
    title: "이미지 URL 삽입",
    description: "이미지 주소를 넣으면 현재 커서 위치에 바로 삽입됩니다.",
    placeholder: "https://example.com/image.png",
    submitLabel: "이미지 삽입",
  },
  link: {
    title: "링크 설정",
    description: "비워두고 적용하면 현재 링크가 제거됩니다.",
    placeholder: "https://example.com",
    submitLabel: "링크 적용",
  },
  math: {
    title: "수식 삽입",
    description: "LaTeX 문법으로 수식을 입력하면 현재 커서 위치에 인라인 수식이 추가됩니다.",
    placeholder: "E = mc^2",
    submitLabel: "수식 삽입",
  },
  youtube: {
    title: "YouTube 삽입",
    description: "YouTube 동영상 URL을 입력하면 임베드 블록이 추가됩니다.",
    placeholder: "https://www.youtube.com/watch?v=...",
    submitLabel: "동영상 삽입",
  },
}

function getSlashCommandState(editor: Editor | null): SlashCommandState | null {
  if (!editor || !editor.isEditable) {
    return null
  }

  const { empty, $from } = editor.state.selection
  if (!empty) {
    return null
  }

  const parent = $from.parent
  if (!parent.isTextblock) {
    return null
  }

  const blockText = parent.textContent
  if (!blockText.startsWith("/")) {
    return null
  }

  return {
    blockText,
    from: $from.start(),
    query: blockText.slice(1).trim(),
    to: $from.end(),
  }
}

export function TiptapEditor({
  className = "",
  content,
  documentActions,
  onChange,
  onError,
  onUploadStateChange,
}: TiptapEditorProps) {
  const [editorVersion, setEditorVersion] = useState(0)
  const [insertDialogMode, setInsertDialogMode] = useState<InsertDialogMode | null>(null)
  const [insertError, setInsertError] = useState<string | null>(null)
  const [insertValue, setInsertValue] = useState("")
  const [isBlockInsertMenuOpen, setIsBlockInsertMenuOpen] = useState(false)
  const [isBlockTransformMenuOpen, setIsBlockTransformMenuOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [dismissedSlashText, setDismissedSlashText] = useState<string | null>(null)
  const [hoveredBlock, setHoveredBlock] = useState<HoveredBlockState | null>(null)
  const editorFrameRef = useRef<HTMLDivElement | null>(null)
  const [hasTextSelection, setHasTextSelection] = useState(false)
  const [tableSelection, setTableSelection] = useState<ReturnType<typeof getTableSelectionState>>(null)
  const [rowHeightInput, setRowHeightInput] = useState("")
  const [columnWidthInput, setColumnWidthInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const colorPickerRef = useRef<HTMLDivElement | null>(null)
  const highlightPickerRef = useRef<HTMLDivElement | null>(null)
  const latestSelectedSlashIndexRef = useRef(0)
  const latestSlashActionsRef = useRef<EditorAction[]>([])
  const latestSlashStateRef = useRef<SlashCommandState | null>(null)
  const runSlashActionRef = useRef<(action: EditorAction) => void>(() => undefined)

  const updateUploadingState = (nextValue: boolean) => {
    setIsUploading(nextValue)
    onUploadStateChange?.(nextValue)
  }

  const reportError = (message: string, error?: unknown) => {
    console.error(message, error)
    if (onError) {
      onError(message)
      return
    }

    window.alert(message)
  }

  const syncEditorUiState = (activeEditor: Editor) => {
    setTableSelection(getTableSelectionState(activeEditor))
    setHasTextSelection(!activeEditor.state.selection.empty && !(activeEditor.state.selection instanceof CellSelection))
  }

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: content || undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "notion-content focus:outline-none",
      },
      handleKeyDown: (_view, event) => {
        const slashState = latestSlashStateRef.current
        const slashActions = latestSlashActionsRef.current

        if (!slashState || slashActions.length === 0) {
          return false
        }

        if (event.key === "ArrowDown") {
          event.preventDefault()
          setSelectedSlashIndex((currentIndex) => (currentIndex + 1) % slashActions.length)
          return true
        }

        if (event.key === "ArrowUp") {
          event.preventDefault()
          setSelectedSlashIndex((currentIndex) => (currentIndex - 1 + slashActions.length) % slashActions.length)
          return true
        }

        if (event.key === "Enter" || event.key === "Tab") {
          const selectedAction = slashActions[latestSelectedSlashIndexRef.current] || slashActions[0]
          if (!selectedAction) {
            return false
          }

          event.preventDefault()
          runSlashActionRef.current(selectedAction)
          return true
        }

        if (event.key === "Escape") {
          event.preventDefault()
          setDismissedSlashText(slashState.blockText)
          return true
        }

        return false
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find((item) => item.type.indexOf("image") !== -1)

        if (imageItem) {
          event.preventDefault()
          const file = imageItem.getAsFile()
          if (file) {
            void addUploadedImage(file)
          }
          return true
        }
        return false
      },
    },
    onCreate: ({ editor: activeEditor }) => {
      syncEditorUiState(activeEditor)
      setEditorVersion((currentVersion) => currentVersion + 1)
    },
    onSelectionUpdate: ({ editor: activeEditor }) => {
      syncEditorUiState(activeEditor)
      setEditorVersion((currentVersion) => currentVersion + 1)
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getJSON())
      syncEditorUiState(activeEditor)
      setEditorVersion((currentVersion) => currentVersion + 1)
    },
  })

  const resetInsertDialog = () => {
    setInsertDialogMode(null)
    setInsertValue("")
    setInsertError(null)
  }

  const openInsertDialog = (mode: InsertDialogMode) => {
    if (!editor) {
      return
    }

    setInsertDialogMode(mode)
    setInsertError(null)

    if (mode === "link") {
      setInsertValue((editor.getAttributes("link").href as string | undefined) || "")
      return
    }

    setInsertValue("")
  }

  const addUploadedImage = async (file: File) => {
    if (!editor) {
      return
    }

    try {
      updateUploadingState(true)
      const url = await uploadMedia(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch (error) {
      reportError(error instanceof Error ? error.message : "이미지 처리에 실패했습니다.", error)
    } finally {
      updateUploadingState(false)
    }
  }

  const insertTable = () => {
    if (!editor) return
    const rowsInput = window.prompt("표 행 수를 입력하세요 (헤더 포함, 1-10)", "3")
    if (rowsInput === null) {
      return
    }

    const colsInput = window.prompt("표 열 수를 입력하세요 (1-10)", "3")
    if (colsInput === null) {
      return
    }

    const rows = Number.parseInt(rowsInput, 10)
    const cols = Number.parseInt(colsInput, 10)

    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1 || rows > 10 || cols > 10) {
      reportError("표 크기는 1에서 10 사이의 숫자로 입력해주세요.")
      return
    }

    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
  }

  const clearSlashCommand = () => {
    if (!editor) {
      return
    }

    const activeSlashState = latestSlashStateRef.current
    if (!activeSlashState) {
      return
    }

    editor.chain().focus().deleteRange({ from: activeSlashState.from, to: activeSlashState.to }).run()
    setDismissedSlashText(null)
  }

  const applyInsertDialog = () => {
    if (!editor || !insertDialogMode) {
      return
    }

    const value = insertValue.trim()
    setInsertError(null)

    if (insertDialogMode === "link") {
      if (!value) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run()
        resetInsertDialog()
        return
      }

      editor.chain().focus().extendMarkRange("link").setLink({ href: normalizeUrl(value) }).run()
      resetInsertDialog()
      return
    }

    if (!value) {
      setInsertError("값을 입력해주세요.")
      return
    }

    if (insertDialogMode === "image") {
      editor.chain().focus().setImage({ src: value }).run()
      resetInsertDialog()
      return
    }

    if (insertDialogMode === "math") {
      editor.chain().focus().insertInlineMath({ latex: value }).run()
      resetInsertDialog()
      return
    }

    editor.chain().focus().setYoutubeVideo({ src: value }).run()
    resetInsertDialog()
  }

  const applyRowHeight = (nextValue: number) => {
    if (!editor) {
      return
    }

    if (!setCurrentRowHeight(editor, nextValue)) {
      reportError("행 높이를 조절하지 못했습니다.")
      return
    }

    syncEditorUiState(editor)
  }

  const applyColumnWidth = (nextValue: number) => {
    if (!editor) {
      return
    }

    if (!setCurrentColumnWidth(editor, nextValue)) {
      reportError("열 너비를 조절하지 못했습니다.")
      return
    }

    syncEditorUiState(editor)
  }

  const commitRowHeightInput = () => {
    if (!tableSelection) {
      return
    }

    const parsed = Number.parseInt(rowHeightInput, 10)
    if (Number.isFinite(parsed)) {
      applyRowHeight(parsed)
      return
    }

    setRowHeightInput(String(tableSelection.rowHeight))
  }

  const commitColumnWidthInput = () => {
    if (!tableSelection) {
      return
    }

    const parsed = Number.parseInt(columnWidthInput, 10)
    if (Number.isFinite(parsed)) {
      applyColumnWidth(parsed)
      return
    }

    setColumnWidthInput(String(tableSelection.columnWidth))
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

  const actionContext = editor
    ? {
        documentActions,
        editor,
        insertTable,
        openImagePicker: () => fileInputRef.current?.click(),
        openInsertDialog,
      }
    : null

  const slashState = useMemo(() => getSlashCommandState(editor), [editor, editorVersion])

  const floatingActions = useMemo(() => {
    if (!actionContext) {
      return []
    }

    return getActionsForSurface(EDITOR_ACTIONS, actionContext, "floating")
  }, [actionContext, editorVersion])

  const paletteActions = useMemo(() => {
    if (!actionContext) {
      return []
    }

    return getActionsForSurface(EDITOR_ACTIONS, actionContext, "palette")
  }, [actionContext, editorVersion])

  const blockActions = useMemo(() => {
    if (!actionContext) {
      return []
    }

    return getActionsForSurface(EDITOR_ACTIONS, actionContext, "block")
  }, [actionContext, editorVersion])

  const slashActions = useMemo(() => {
    if (!actionContext || !slashState) {
      return []
    }

    const visibleActions = getActionsForSurface(EDITOR_ACTIONS, actionContext, "slash")
    return filterEditorActions(visibleActions, slashState.query)
  }, [actionContext, slashState])

  const blockInsertActions = useMemo(
    () => blockActions.filter((action) => !BLOCK_TRANSFORM_ACTION_IDS.has(action.id)),
    [blockActions],
  )

  const blockTransformActions = useMemo(() => {
    if (!hoveredBlock || !canTransformTopLevelBlock(hoveredBlock.block)) {
      return []
    }

    return blockActions.filter((action) => BLOCK_TRANSFORM_ACTION_IDS.has(action.id))
  }, [blockActions, hoveredBlock])

  const isSlashMenuOpen = Boolean(
    slashState &&
    slashActions.length > 0 &&
    slashState.blockText !== dismissedSlashText,
  )
  const isBlockMenuOpen = isBlockInsertMenuOpen || isBlockTransformMenuOpen

  const runEditorAction = (action: EditorAction, options?: { clearSlash?: boolean }) => {
    if (!actionContext) {
      return
    }

    if (options?.clearSlash) {
      clearSlashCommand()
    }

    setIsCommandPaletteOpen(false)
    action.run(actionContext)
  }

  const updateHoveredBlock = (target: EventTarget | null) => {
    if (!editor || !editorFrameRef.current) {
      return
    }

    const hit = getTopLevelBlockFromTarget(editor, target)
    if (!hit) {
      return
    }

    const frameRect = editorFrameRef.current.getBoundingClientRect()
    const blockRect = hit.element.getBoundingClientRect()
    const nextHoveredBlock = {
      block: hit.block,
      top: blockRect.top - frameRect.top,
    }

    setHoveredBlock((currentBlock) => {
      if (
        currentBlock &&
        currentBlock.block.index === nextHoveredBlock.block.index &&
        currentBlock.block.from === nextHoveredBlock.block.from &&
        Math.abs(currentBlock.top - nextHoveredBlock.top) < 1
      ) {
        return currentBlock
      }

      return nextHoveredBlock
    })
  }

  const handleEditorFrameMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    updateHoveredBlock(event.target)
  }

  const handleEditorFrameMouseLeave = () => {
    if (!isBlockMenuOpen) {
      setHoveredBlock(null)
    }
  }

  const runBlockTransformAction = (action: EditorAction) => {
    if (!editor || !hoveredBlock) {
      return
    }

    focusTopLevelBlock(editor, hoveredBlock.block)
    setHoveredBlock(null)
    runEditorAction(action)
  }

  const runBlockInsertAction = (action: EditorAction) => {
    if (!editor || !hoveredBlock) {
      return
    }

    focusAfterTopLevelBlock(editor, hoveredBlock.block)
    setHoveredBlock(null)
    runEditorAction(action)
  }

  const insertParagraphBelow = () => {
    if (!editor || !hoveredBlock) {
      return
    }

    insertParagraphBelowTopLevelBlock(editor, hoveredBlock.block)
    setHoveredBlock(null)
  }

  const duplicateBlock = () => {
    if (!editor || !hoveredBlock) {
      return
    }

    duplicateTopLevelBlock(editor, hoveredBlock.block)
    setHoveredBlock(null)
  }

  const deleteBlock = () => {
    if (!editor || !hoveredBlock) {
      return
    }

    deleteTopLevelBlock(editor, hoveredBlock.block)
    setHoveredBlock(null)
  }

  latestSelectedSlashIndexRef.current = selectedSlashIndex
  latestSlashActionsRef.current = isSlashMenuOpen ? slashActions : []
  latestSlashStateRef.current = isSlashMenuOpen ? slashState : null
  runSlashActionRef.current = (action: EditorAction) => {
    runEditorAction(action, { clearSlash: true })
  }

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
    if (!tableSelection) {
      setRowHeightInput("")
      setColumnWidthInput("")
      return
    }

    setRowHeightInput(String(tableSelection.rowHeight))
    setColumnWidthInput(String(tableSelection.columnWidth))
  }, [tableSelection])

  useEffect(() => {
    setSelectedSlashIndex(0)
  }, [slashState?.query])

  useEffect(() => {
    if (slashActions.length === 0) {
      setSelectedSlashIndex(0)
      return
    }

    setSelectedSlashIndex((currentIndex) => Math.min(currentIndex, slashActions.length - 1))
  }, [slashActions.length])

  useEffect(() => {
    if (slashState && dismissedSlashText && slashState.blockText !== dismissedSlashText) {
      setDismissedSlashText(null)
    }
  }, [dismissedSlashText, slashState])

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

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

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
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="제목 3"
        >
          <span className="text-xs font-semibold">H3</span>
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          data-active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          title="제목 4"
        >
          <span className="text-xs font-semibold">H4</span>
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
          onClick={() => openInsertDialog("link")}
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
              void addUploadedImage(file)
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
                      editor.chain().focus().setColor(color).run()
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
                  editor.chain().focus().unsetColor().run()
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
                        editor.chain().focus().unsetHighlight().run()
                      } else {
                        editor.chain().focus().setHighlight({ color }).run()
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
          onClick={() => openInsertDialog("math")}
          title="수식 삽입"
        >
          <PlusSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="notion-toolbar-button"
          onClick={() => openInsertDialog("youtube")}
          title="YouTube 삽입"
        >
          <Video className="h-4 w-4" />
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs text-neutral-slate-500">
          {isUploading && <span>이미지 업로드 중...</span>}
          <span>마크다운 문법도 사용 가능</span>
          <span> / 명령어</span>
          <span>Cmd/Ctrl+K</span>
        </div>
      </div>
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: activeEditor }) => activeEditor.isEditable && (hasTextSelection || tableSelection !== null)}
        options={{
          placement: tableSelection ? "top-start" : "top",
        }}
      >
        {(hasTextSelection || tableSelection) && (
          <div className="notion-table-menu">
            {hasTextSelection && (
              <div className="notion-table-group">
                <span className="notion-table-label">서식</span>
                <button
                  type="button"
                  data-active={editor.isActive("bold")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className="notion-table-action"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-active={editor.isActive("italic")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className="notion-table-action"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-active={editor.isActive("strike")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className="notion-table-action"
                >
                  <Strikethrough className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-active={editor.isActive("code")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className="notion-table-action"
                >
                  <Code2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-active={editor.isActive("link")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => openInsertDialog("link")}
                  className="notion-table-action"
                >
                  <Link2 className="h-4 w-4" />
                </button>
              </div>
            )}
            {tableSelection && (
              <>
            <div className="notion-table-group">
              <span className="notion-table-label">
                행 {tableSelection.row + 1}/{tableSelection.rowCount}
              </span>
              <button
                type="button"
                className="notion-table-action"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor.chain().focus().addRowBefore().run()}
              >
                위 +
              </button>
              <button
                type="button"
                className="notion-table-action"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                아래 +
              </button>
              <button
                type="button"
                className="notion-table-action destructive"
                disabled={tableSelection.rowCount <= 1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                행 삭제
              </button>
            </div>
            <div className="notion-table-group">
              <span className="notion-table-label">행 높이</span>
              <button
                type="button"
                className="notion-table-stepper"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyRowHeight(tableSelection.rowHeight - ROW_HEIGHT_STEP)}
              >
                -
              </button>
              <input
                type="number"
                min={MIN_ROW_HEIGHT}
                max={MAX_ROW_HEIGHT}
                value={rowHeightInput}
                onChange={(event) => setRowHeightInput(event.target.value)}
                onBlur={commitRowHeightInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    commitRowHeightInput()
                  }
                }}
                className="notion-table-input"
              />
              <button
                type="button"
                className="notion-table-stepper"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyRowHeight(tableSelection.rowHeight + ROW_HEIGHT_STEP)}
              >
                +
              </button>
            </div>
            <div className="notion-table-group">
              <span className="notion-table-label">
                열 {tableSelection.column + 1}/{tableSelection.columnCount}
              </span>
              <button
                type="button"
                className="notion-table-action"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor.chain().focus().addColumnBefore().run()}
              >
                왼쪽 +
              </button>
              <button
                type="button"
                className="notion-table-action"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                오른쪽 +
              </button>
              <button
                type="button"
                className="notion-table-action destructive"
                disabled={tableSelection.columnCount <= 1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor.chain().focus().deleteColumn().run()}
              >
                열 삭제
              </button>
            </div>
            <div className="notion-table-group">
              <span className="notion-table-label">열 너비</span>
              <button
                type="button"
                className="notion-table-stepper"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyColumnWidth(tableSelection.columnWidth - COLUMN_WIDTH_STEP)}
              >
                -
              </button>
              <input
                type="number"
                min={MIN_COLUMN_WIDTH}
                max={MAX_COLUMN_WIDTH}
                value={columnWidthInput}
                onChange={(event) => setColumnWidthInput(event.target.value)}
                onBlur={commitColumnWidthInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    commitColumnWidthInput()
                  }
                }}
                className="notion-table-input"
              />
              <button
                type="button"
                className="notion-table-stepper"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyColumnWidth(tableSelection.columnWidth + COLUMN_WIDTH_STEP)}
              >
                +
              </button>
            </div>
            <div className="notion-table-group">
              <button
                type="button"
                className="notion-table-action destructive"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                표 삭제
              </button>
            </div>
              </>
            )}
          </div>
        )}
      </BubbleMenu>

      <FloatingMenu
        editor={editor}
        shouldShow={({ state }) => {
          if (!editor.isEditable || !state.selection.empty) {
            return false
          }

          if (isSlashMenuOpen) {
            return true
          }

          return state.selection.$from.parent.textContent.trim().length === 0
        }}
      >
        {isSlashMenuOpen ? (
          <SlashCommandMenu
            actions={slashActions}
            selectedIndex={selectedSlashIndex}
            onHoverIndexChange={setSelectedSlashIndex}
            onSelect={(action) => runEditorAction(action, { clearSlash: true })}
          />
        ) : (
          <div className="notion-floating-menu">
            {floatingActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  type="button"
                  data-active={action.isActive?.(editor)}
                  onClick={() => runEditorAction(action)}
                  className="notion-menu-button"
                  title={action.title}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        )}
      </FloatingMenu>

      <div
        ref={editorFrameRef}
        className="notion-editor-frame"
        onMouseLeave={handleEditorFrameMouseLeave}
        onMouseMove={handleEditorFrameMouseMove}
      >
        {hoveredBlock ? (
          <BlockHandleMenu
            top={hoveredBlock.top}
            insertActions={blockInsertActions}
            transformActions={blockTransformActions}
            onInsertActionSelect={runBlockInsertAction}
            onTransformActionSelect={runBlockTransformAction}
            onInsertParagraphBelow={insertParagraphBelow}
            onDuplicateBlock={duplicateBlock}
            onDeleteBlock={deleteBlock}
            onInsertMenuOpenChange={setIsBlockInsertMenuOpen}
            onTransformMenuOpenChange={setIsBlockTransformMenuOpen}
          />
        ) : null}
        <EditorContent editor={editor} />
      </div>

      <EditorCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        actions={paletteActions}
        onSelect={(action) => runEditorAction(action)}
      />

      <Dialog
        open={insertDialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            resetInsertDialog()
          }
        }}
      >
        <DialogContent className="max-w-md">
          {insertDialogMode && (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                applyInsertDialog()
              }}
            >
              <DialogHeader>
                <DialogTitle>{INSERT_DIALOG_COPY[insertDialogMode].title}</DialogTitle>
                <DialogDescription>{INSERT_DIALOG_COPY[insertDialogMode].description}</DialogDescription>
              </DialogHeader>
              <Input
                value={insertValue}
                onChange={(event) => setInsertValue(event.target.value)}
                placeholder={INSERT_DIALOG_COPY[insertDialogMode].placeholder}
                autoFocus
              />
              {insertError && <p className="text-sm text-red-500">{insertError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetInsertDialog}>
                  취소
                </Button>
                <Button type="submit">{INSERT_DIALOG_COPY[insertDialogMode].submitLabel}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
