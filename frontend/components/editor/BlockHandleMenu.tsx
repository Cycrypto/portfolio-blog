"use client"

import { useEffect, useState } from "react"
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditorAction, groupEditorActions } from "@/lib/tiptap/editor-actions"

interface BlockHandleMenuProps {
  insertActions: EditorAction[]
  onDeleteBlock: () => void
  onDuplicateBlock: () => void
  onInsertActionSelect: (action: EditorAction) => void
  onInsertMenuOpenChange: (open: boolean) => void
  onInsertParagraphBelow: () => void
  onTransformActionSelect: (action: EditorAction) => void
  onTransformMenuOpenChange: (open: boolean) => void
  top: number
  transformActions: EditorAction[]
}

export function BlockHandleMenu({
  insertActions,
  onDeleteBlock,
  onDuplicateBlock,
  onInsertActionSelect,
  onInsertMenuOpenChange,
  onInsertParagraphBelow,
  onTransformActionSelect,
  onTransformMenuOpenChange,
  top,
  transformActions,
}: BlockHandleMenuProps) {
  const [insertOpen, setInsertOpen] = useState(false)
  const [transformOpen, setTransformOpen] = useState(false)

  useEffect(() => {
    onInsertMenuOpenChange(insertOpen)
  }, [insertOpen, onInsertMenuOpenChange])

  useEffect(() => {
    onTransformMenuOpenChange(transformOpen)
  }, [onTransformMenuOpenChange, transformOpen])

  const groupedInsertActions = groupEditorActions(insertActions)
  const groupedTransformActions = groupEditorActions(transformActions)

  return (
    <div className="notion-block-handle" style={{ top }}>
      <DropdownMenu open={insertOpen} onOpenChange={setInsertOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="notion-block-handle-button" aria-label="아래에 블록 삽입">
            <Plus className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="notion-block-menu-content w-72" sideOffset={10}>
          <DropdownMenuLabel className="notion-block-menu-label">새 블록 삽입</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onInsertParagraphBelow}>
            <Plus className="h-4 w-4 text-neutral-slate-500" />
            빈 텍스트 줄
            <DropdownMenuShortcut>Enter</DropdownMenuShortcut>
          </DropdownMenuItem>
          {groupedInsertActions.map(({ group, actions }) => (
            <div key={group}>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="notion-block-menu-section">{group}</DropdownMenuLabel>
              {actions.map((action) => {
                const Icon = action.icon

                return (
                  <DropdownMenuItem key={action.id} onSelect={() => onInsertActionSelect(action)}>
                    <Icon className="h-4 w-4 text-neutral-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{action.title}</div>
                      <div className="truncate text-xs text-neutral-slate-500">{action.description}</div>
                    </div>
                    {action.shortcut ? <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut> : null}
                  </DropdownMenuItem>
                )
              })}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu open={transformOpen} onOpenChange={setTransformOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="notion-block-handle-button" aria-label="블록 작업">
            <GripVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="notion-block-menu-content w-80" sideOffset={10}>
          <DropdownMenuLabel className="notion-block-menu-label">블록 작업</DropdownMenuLabel>
          {groupedTransformActions.map(({ group, actions }) => (
            <div key={group}>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="notion-block-menu-section">{group}</DropdownMenuLabel>
              {actions.map((action) => {
                const Icon = action.icon

                return (
                  <DropdownMenuItem key={action.id} onSelect={() => onTransformActionSelect(action)}>
                    <Icon className="h-4 w-4 text-neutral-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{action.title}</div>
                      <div className="truncate text-xs text-neutral-slate-500">{action.description}</div>
                    </div>
                    {action.shortcut ? <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut> : null}
                  </DropdownMenuItem>
                )
              })}
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onDuplicateBlock}>
            <Copy className="h-4 w-4 text-neutral-slate-500" />
            블록 복제
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDeleteBlock}
            className="text-red-500 focus:bg-red-50 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            블록 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
