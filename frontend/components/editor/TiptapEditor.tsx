"use client"

import type { Editor } from "@tiptap/core"
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, JSONContent, useEditor } from "@tiptap/react"
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus"
import { CellSelection } from "@tiptap/pm/tables"
import { Button } from "@/components/ui/button"
import { BlockHandleMenu } from "@/components/editor/BlockHandleMenu"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
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
import { useIsMobile } from "@/components/ui/use-mobile"
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
  focusTopLevelBlock,
  getTopLevelBlockAtCoords,
  getTopLevelBlockFromSelection,
  getTopLevelBlockFromTarget,
  moveTopLevelBlock,
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
import { Bold, Code2, Italic, Link2, Strikethrough } from "lucide-react"

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

interface BlockDropIndicatorState {
  placement: "before" | "after"
  targetIndex: number
  top: number
}

interface SlashMenuPosition {
  left: number
  top: number
}

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

const BLOCK_HANDLE_HEIGHT = 42
const MOBILE_BLOCK_HANDLE_HEIGHT = 38
const DESKTOP_SLASH_MENU_WIDTH = 352
const MOBILE_SLASH_MENU_WIDTH = 320
const TEXT_ANCHOR_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, figcaption, td, th"

function getBlockAnchorRect(element: HTMLElement) {
  const anchor = element.matches(TEXT_ANCHOR_SELECTOR)
    ? element
    : element.querySelector<HTMLElement>(TEXT_ANCHOR_SELECTOR)

  return anchor?.getBoundingClientRect() ?? element.getBoundingClientRect()
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
  const isMobile = useIsMobile()
  const [editorVersion, setEditorVersion] = useState(0)
  const [insertDialogMode, setInsertDialogMode] = useState<InsertDialogMode | null>(null)
  const [insertError, setInsertError] = useState<string | null>(null)
  const [insertValue, setInsertValue] = useState("")
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0)
  const [dismissedSlashText, setDismissedSlashText] = useState<string | null>(null)
  const [hoveredBlock, setHoveredBlock] = useState<HoveredBlockState | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<HoveredBlockState | null>(null)
  const [dropIndicator, setDropIndicator] = useState<BlockDropIndicatorState | null>(null)
  const editorFrameRef = useRef<HTMLDivElement | null>(null)
  const [hasTextSelection, setHasTextSelection] = useState(false)
  const [tableSelection, setTableSelection] = useState<ReturnType<typeof getTableSelectionState>>(null)
  const [rowHeightInput, setRowHeightInput] = useState("")
  const [columnWidthInput, setColumnWidthInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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

  const mobileOverflowActions = useMemo(() => {
    if (!actionContext) {
      return []
    }

    return getActionsForSurface(EDITOR_ACTIONS, actionContext, "mobile-overflow")
  }, [actionContext, editorVersion])

  const slashActions = useMemo(() => {
    if (!actionContext || !slashState) {
      return []
    }

    const visibleActions = getActionsForSurface(EDITOR_ACTIONS, actionContext, "slash")
    return filterEditorActions(visibleActions, slashState.query)
  }, [actionContext, slashState])

  const isSlashMenuOpen = Boolean(
    slashState &&
    slashActions.length > 0 &&
    slashState.blockText !== dismissedSlashText,
  )
  const isDraggingBlock = draggedBlock !== null

  const slashMenuPosition: SlashMenuPosition | null =
    editor && editorFrameRef.current && isSlashMenuOpen
      ? (() => {
          const frameRect = editorFrameRef.current!.getBoundingClientRect()
          const cursorCoords = editor.view.coordsAtPos(editor.state.selection.from)
          const menuWidth = isMobile ? MOBILE_SLASH_MENU_WIDTH : DESKTOP_SLASH_MENU_WIDTH
          const maxLeft = Math.max(12, frameRect.width - menuWidth - 12)

          return {
            left: Math.min(Math.max(12, cursorCoords.left - frameRect.left - 18), maxLeft),
            top: cursorCoords.bottom - frameRect.top + 10,
          }
        })()
      : null

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

  const createHoveredBlockState = (block: TopLevelBlockRange, element: HTMLElement) => {
    if (!editorFrameRef.current) {
      return null
    }

    const frameRect = editorFrameRef.current.getBoundingClientRect()
    const anchorRect = getBlockAnchorRect(element)
    const handleHeight = isMobile ? MOBILE_BLOCK_HANDLE_HEIGHT : BLOCK_HANDLE_HEIGHT

    return {
      block,
      top:
        anchorRect.top -
        frameRect.top +
        (anchorRect.height - handleHeight) / 2,
    }
  }

  const setHoveredBlockFromHit = (hit: { block: TopLevelBlockRange; element: HTMLElement } | null) => {
    if (!hit) {
      return
    }

    const nextHoveredBlock = createHoveredBlockState(hit.block, hit.element)
    if (!nextHoveredBlock) {
      return
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

  const updateHoveredBlock = (target: EventTarget | null, clientX?: number, clientY?: number) => {
    if (!editor || !editorFrameRef.current) {
      return
    }

    const hit =
      typeof clientX === "number" && typeof clientY === "number"
        ? getTopLevelBlockAtCoords(editor, { clientX, clientY }) || getTopLevelBlockFromTarget(editor, target)
        : getTopLevelBlockFromTarget(editor, target)

    if (hit) {
      setHoveredBlockFromHit(hit)
      return
    }

    if (!isMobile) {
      setHoveredBlock(null)
    }
  }

  const handleEditorFrameMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (isDraggingBlock) {
      return
    }

    updateHoveredBlock(event.target, event.clientX, event.clientY)
  }

  const handleEditorFrameMouseLeave = () => {
    if (!isDraggingBlock && !isMobile) {
      setHoveredBlock(null)
    }
  }

  const clearDragState = () => {
    setDraggedBlock(null)
    setDropIndicator(null)
  }

  const updateDropIndicatorFromPoint = (clientX: number, clientY: number) => {
    if (!editor || !editorFrameRef.current || !draggedBlock) {
      return
    }

    const hit = getTopLevelBlockAtCoords(editor, { clientX, clientY })

    if (!hit) {
      setDropIndicator(null)
      return
    }

    const nextHoveredBlock = createHoveredBlockState(hit.block, hit.element)
    if (nextHoveredBlock) {
      setHoveredBlock(nextHoveredBlock)
    }

    const frameRect = editorFrameRef.current.getBoundingClientRect()
    const blockRect = hit.element.getBoundingClientRect()
    const placement = clientY < blockRect.top + blockRect.height / 2 ? "before" : "after"

    setDropIndicator({
      placement,
      targetIndex: hit.block.index,
      top: blockRect.top - frameRect.top + (placement === "after" ? blockRect.height : 0),
    })
  }

  const handleBlockDragStart = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (!editor || !hoveredBlock) {
      return
    }

    event.preventDefault()
    focusTopLevelBlock(editor, hoveredBlock.block)
    setDraggedBlock(hoveredBlock)
    setDropIndicator(null)
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
    if (!draggedBlock) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      updateDropIndicatorFromPoint(event.clientX, event.clientY)
    }

    const handleMouseUp = () => {
      if (editor && draggedBlock && dropIndicator) {
        moveTopLevelBlock(editor, draggedBlock.block.index, dropIndicator.targetIndex, dropIndicator.placement)
        syncEditorUiState(editor)
        setEditorVersion((currentVersion) => currentVersion + 1)
      }

      clearDragState()
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggedBlock, dropIndicator, editor])

  useEffect(() => {
    if (!editor || isDraggingBlock) {
      return
    }

    if (!isMobile) {
      return
    }

    const selectedBlock = getTopLevelBlockFromSelection(editor)
    if (!selectedBlock) {
      return
    }

    const element = editor.view.dom.children[selectedBlock.index]
    if (element instanceof HTMLElement) {
      const nextHoveredBlock = createHoveredBlockState(selectedBlock, element)
      if (nextHoveredBlock) {
        setHoveredBlock(nextHoveredBlock)
      }
    }
  }, [editor, editorVersion, isDraggingBlock, isMobile])

  useEffect(() => {
    if (isMobile) {
      return
    }

    if (!isDraggingBlock) {
      setHoveredBlock(null)
    }
  }, [isDraggingBlock, isMobile])

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
      {actionContext ? (
        <EditorToolbar
          editor={editor}
          actionContext={actionContext}
          isUploading={isUploading}
          mobileOverflowActions={mobileOverflowActions}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onRunAction={runEditorAction}
        />
      ) : null}
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

          return state.selection.$from.parent.textContent.trim().length === 0
        }}
      >
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
      </FloatingMenu>

      <div
        ref={editorFrameRef}
        className="notion-editor-frame"
        onMouseLeave={handleEditorFrameMouseLeave}
        onMouseMove={handleEditorFrameMouseMove}
      >
        {hoveredBlock ? (
          <BlockHandleMenu
            isDragging={isDraggingBlock}
            top={hoveredBlock.top}
            onDragHandleMouseDown={handleBlockDragStart}
          />
        ) : null}
        {dropIndicator ? (
          <div
            className="notion-block-drop-indicator"
            style={{ top: dropIndicator.top }}
          />
        ) : null}
        {isSlashMenuOpen && slashMenuPosition ? (
          <div
            className="notion-slash-menu-layer"
            style={{ left: slashMenuPosition.left, top: slashMenuPosition.top }}
          >
            <SlashCommandMenu
              actions={slashActions}
              selectedIndex={selectedSlashIndex}
              onHoverIndexChange={setSelectedSlashIndex}
              onSelect={(action) => runEditorAction(action, { clearSlash: true })}
            />
          </div>
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
