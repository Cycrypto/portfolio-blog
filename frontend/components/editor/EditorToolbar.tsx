"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { Editor } from "@tiptap/core"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CircleHelp,
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
  MoreHorizontal,
  Palette,
  PlusSquare,
  Quote,
  Strikethrough,
  Table as TableIcon,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { EditorAction, EditorActionContext } from "@/lib/tiptap/editor-actions"
import { cn } from "@/lib/utils"

interface EditorToolbarProps {
  actionContext: EditorActionContext
  editor: Editor
  isUploading: boolean
  mobileOverflowActions: EditorAction[]
  onOpenCommandPalette: () => void
  onRunAction: (action: EditorAction) => void
}

interface ToolbarButtonProps {
  active?: boolean
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick: () => void
  title: string
}

const MOBILE_PRIMARY_ACTION_IDS = new Set(["heading-1", "image-upload", "task-list", "bullet-list"])

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

function ToolbarButton({
  active = false,
  children,
  className,
  disabled = false,
  onClick,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={cn("notion-toolbar-button", className)}
      data-active={active}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

function ToolbarHelp({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return null
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="notion-toolbar-help" aria-label="작성 도움말">
            <CircleHelp className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs leading-5">
          <div>좌측 rail: 블록 이동</div>
          <div>`/` 명령어와 `Cmd/Ctrl+K` 팔레트는 그대로 사용할 수 있습니다.</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function EditorToolbar({
  actionContext,
  editor,
  isUploading,
  mobileOverflowActions,
  onOpenCommandPalette,
  onRunAction,
}: EditorToolbarProps) {
  const [isMobileOverflowOpen, setIsMobileOverflowOpen] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement | null>(null)
  const highlightPickerRef = useRef<HTMLDivElement | null>(null)

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

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showColorPicker, showHighlightPicker])

  const mobileOverflowItems = useMemo(
    () => mobileOverflowActions.filter((action) => !MOBILE_PRIMARY_ACTION_IDS.has(action.id)),
    [mobileOverflowActions],
  )

  const runMobileOverflowAction = (action: EditorAction) => {
    setIsMobileOverflowOpen(false)
    onRunAction(action)
  }

  return (
    <>
      <div className="notion-toolbar">
        <div className="notion-toolbar-section notion-toolbar-section-primary">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="굵게 (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="기울임 (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            className="hidden sm:inline-flex"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="취소선"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="제목 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            className="hidden sm:inline-flex"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="제목 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="불릿 리스트"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            className="hidden sm:inline-flex"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="번호 리스트"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="체크리스트"
          >
            <ListTodo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("link")}
            onClick={() => actionContext.openInsertDialog("link")}
            title="링크"
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={isUploading}
            onClick={actionContext.openImagePicker}
            title="이미지 업로드"
          >
            <Image className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="notion-toolbar-section notion-toolbar-section-desktop">
          <div className="notion-toolbar-divider" />
          <ToolbarButton
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="인라인 코드"
          >
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="인용구"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <div className="notion-toolbar-divider" />

          <div className="relative">
            <ToolbarButton
              onClick={() => setShowColorPicker((current) => !current)}
              title="텍스트 색상"
            >
              <Palette className="h-4 w-4" />
            </ToolbarButton>
            {showColorPicker ? (
              <div ref={colorPickerRef} className="notion-toolbar-popover">
                <div className="grid grid-cols-6 gap-1">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-6 w-6 rounded-md border border-neutral-slate-200 transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      title={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run()
                        setShowColorPicker(false)
                      }}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full justify-center text-xs"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run()
                    setShowColorPicker(false)
                  }}
                >
                  색상 제거
                </Button>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <ToolbarButton
              active={editor.isActive("highlight")}
              onClick={() => setShowHighlightPicker((current) => !current)}
              title="형광펜"
            >
              <Highlighter className="h-4 w-4" />
            </ToolbarButton>
            {showHighlightPicker ? (
              <div ref={highlightPickerRef} className="notion-toolbar-popover">
                <div className="grid grid-cols-6 gap-1">
                  {highlightColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-6 w-6 rounded-md border border-neutral-slate-200 transition-transform hover:scale-110"
                      style={{ backgroundColor: color === "transparent" ? "#ffffff" : color }}
                      title={color === "transparent" ? "하이라이트 제거" : color}
                      onClick={() => {
                        if (color === "transparent") {
                          editor.chain().focus().unsetHighlight().run()
                        } else {
                          editor.chain().focus().setHighlight({ color }).run()
                        }
                        setShowHighlightPicker(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <ToolbarButton onClick={actionContext.insertTable} title="표 삽입">
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => actionContext.openInsertDialog("math")} title="수식 삽입">
            <PlusSquare className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => actionContext.openInsertDialog("youtube")} title="YouTube 삽입">
            <Video className="h-4 w-4" />
          </ToolbarButton>

          <div className="notion-toolbar-divider" />

          <ToolbarButton
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            title="왼쪽 정렬"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            title="가운데 정렬"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            title="오른쪽 정렬"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "justify" })}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            title="양쪽 정렬"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="notion-toolbar-spacer" />

        <div className="notion-toolbar-section notion-toolbar-section-secondary">
          <ToolbarButton
            className="sm:hidden"
            onClick={() => setIsMobileOverflowOpen(true)}
            title="추가 편집 도구"
          >
            <MoreHorizontal className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            className="hidden sm:inline-flex"
            onClick={onOpenCommandPalette}
            title="명령 팔레트 (Cmd/Ctrl+K)"
          >
            <MoreHorizontal className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarHelp isMobile={false} />
        </div>
      </div>

      <Drawer open={isMobileOverflowOpen} onOpenChange={setIsMobileOverflowOpen}>
        <DrawerContent className="max-h-[80vh] rounded-t-[28px] px-0 pb-8">
          <DrawerHeader className="px-5">
            <DrawerTitle>추가 편집 도구</DrawerTitle>
            <DrawerDescription>
              블록 변환, 삽입, 정렬과 고급 편집 기능을 여기서 실행합니다.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-5 overflow-y-auto px-5">
            <div className="rounded-2xl border border-neutral-slate-200 bg-neutral-slate-50/70 p-4 text-sm text-neutral-slate-600">
              <div>좌측 rail: 블록 이동</div>
              <div>`/` 명령어와 `Cmd/Ctrl+K` 팔레트도 그대로 사용할 수 있습니다.</div>
            </div>
            <div className="grid gap-2">
              {mobileOverflowItems.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.id}
                    type="button"
                    variant="outline"
                    className="justify-start rounded-xl border-neutral-slate-200 bg-white px-4 py-5"
                    onClick={() => runMobileOverflowAction(action)}
                  >
                    <Icon className="h-4 w-4 text-neutral-slate-500" />
                    <span className="flex flex-col items-start gap-0.5 text-left">
                      <span>{action.title}</span>
                      <span className="text-xs text-neutral-slate-500">{action.description}</span>
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
