"use client"

import { EditorAction, groupEditorActions } from "@/lib/tiptap/editor-actions"
import { cn } from "@/lib/utils"

interface SlashCommandMenuProps {
  actions: EditorAction[]
  onHoverIndexChange: (index: number) => void
  onSelect: (action: EditorAction) => void
  selectedIndex: number
}

export function SlashCommandMenu({
  actions,
  onHoverIndexChange,
  onSelect,
  selectedIndex,
}: SlashCommandMenuProps) {
  const groupedActions = groupEditorActions(actions)
  let actionIndex = -1

  return (
    <div className="notion-slash-menu">
      {groupedActions.map(({ group, actions: groupActions }) => (
        <div key={group} className="notion-slash-group">
          <div className="notion-slash-group-title">{group}</div>
          <div className="space-y-1">
            {groupActions.map((action) => {
              actionIndex += 1
              const Icon = action.icon
              const isSelected = actionIndex === selectedIndex

              return (
                <button
                  key={action.id}
                  type="button"
                  data-selected={isSelected}
                  className={cn("notion-slash-item", isSelected && "notion-slash-item-selected")}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onSelect(action)
                  }}
                  onMouseEnter={() => onHoverIndexChange(actionIndex)}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md border border-neutral-slate-200 bg-white p-2 text-neutral-slate-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="font-medium text-neutral-slate-800">{action.title}</div>
                      <div className="text-xs text-neutral-slate-500">{action.description}</div>
                    </div>
                  </div>
                  {action.shortcut ? (
                    <span className="ml-4 shrink-0 text-[11px] uppercase tracking-[0.18em] text-neutral-slate-500">
                      {action.shortcut}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
