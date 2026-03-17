"use client"

import type { MouseEvent as ReactMouseEvent } from "react"
import { GripVertical } from "lucide-react"

interface BlockHandleMenuProps {
  isDragging?: boolean
  onDragHandleMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => void
  top: number
}

export function BlockHandleMenu({
  isDragging = false,
  onDragHandleMouseDown,
  top,
}: BlockHandleMenuProps) {
  return (
    <div className="notion-block-handle" style={{ top }}>
      <button
        type="button"
        className="notion-block-handle-button notion-block-drag-button"
        aria-label="블록 이동"
        data-dragging={isDragging}
        onMouseDown={onDragHandleMouseDown}
      >
        <GripVertical className="h-4 w-4" />
        <span className="sr-only">{isDragging ? "블록 이동 중" : "블록 이동"}</span>
      </button>
    </div>
  )
}
