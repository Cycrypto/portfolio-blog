"use client"

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { EditorAction, groupEditorActions } from "@/lib/tiptap/editor-actions"

interface EditorCommandPaletteProps {
  actions: EditorAction[]
  onOpenChange: (open: boolean) => void
  onSelect: (action: EditorAction) => void
  open: boolean
}

export function EditorCommandPalette({
  actions,
  onOpenChange,
  onSelect,
  open,
}: EditorCommandPaletteProps) {
  const groupedActions = groupEditorActions(actions)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="명령 검색..." />
      <CommandList>
        <CommandEmpty>실행할 명령을 찾지 못했습니다.</CommandEmpty>
        {groupedActions.map(({ group, actions: groupActions }) => (
          <CommandGroup key={group} heading={group}>
            {groupActions.map((action) => {
              const Icon = action.icon
              return (
                <CommandItem
                  key={action.id}
                  value={[action.title, action.description, ...(action.keywords || [])].join(" ")}
                  onSelect={() => onSelect(action)}
                  className="items-start gap-3 py-2.5"
                >
                  <Icon className="mt-0.5 h-4 w-4 text-neutral-slate-500" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium text-neutral-slate-800">{action.title}</span>
                    <span className={cn("text-xs text-neutral-slate-500", !action.description && "hidden")}>
                      {action.description}
                    </span>
                  </div>
                  {action.shortcut ? <CommandShortcut>{action.shortcut}</CommandShortcut> : null}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
