import type { Editor } from "@tiptap/core"
import { selectedRect } from "@tiptap/pm/tables"

export const DEFAULT_ROW_HEIGHT = 56
export const MIN_ROW_HEIGHT = 40
export const MAX_ROW_HEIGHT = 240
export const ROW_HEIGHT_STEP = 12

export const DEFAULT_COLUMN_WIDTH = 180
export const MIN_COLUMN_WIDTH = 80
export const MAX_COLUMN_WIDTH = 480
export const COLUMN_WIDTH_STEP = 24

export interface TableSelectionState {
  row: number
  column: number
  rowCount: number
  columnCount: number
  rowHeight: number
  columnWidth: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function getSelectedTableRect(editor: Editor) {
  if (!editor.isActive("table")) {
    return null
  }

  try {
    return selectedRect(editor.state)
  } catch {
    return null
  }
}

function getMeasuredCellSize(editor: Editor, position: number, dimension: "width" | "height") {
  const domNode = editor.view.nodeDOM(position)
  if (!(domNode instanceof HTMLElement)) {
    return null
  }

  const measuredValue = domNode.getBoundingClientRect()[dimension]
  return measuredValue > 0 ? Math.round(measuredValue) : null
}

export function getTableSelectionState(editor: Editor | null): TableSelectionState | null {
  if (!editor) {
    return null
  }

  const rect = getSelectedTableRect(editor)
  if (!rect) {
    return null
  }

  const selectedCellPos = rect.map.positionAt(rect.top, rect.left, rect.table)
  const firstRowCellPos = rect.map.positionAt(0, rect.left, rect.table)
  const firstRowCell = rect.table.nodeAt(firstRowCellPos)
  const firstRowCellRect = rect.map.findCell(firstRowCellPos)
  const columnWidthIndex = rect.left - firstRowCellRect.left
  const currentColumnWidth = Array.isArray(firstRowCell?.attrs.colwidth)
    ? firstRowCell.attrs.colwidth[columnWidthIndex]
    : null
  const currentRow = rect.table.child(rect.top)
  let rowHeight = DEFAULT_ROW_HEIGHT

  currentRow.forEach((cellNode) => {
    const nextHeight = Number(cellNode.attrs.rowheight)
    if (Number.isFinite(nextHeight) && nextHeight > 0) {
      rowHeight = Math.max(rowHeight, nextHeight)
    }
  })

  return {
    row: rect.top,
    column: rect.left,
    rowCount: rect.map.height,
    columnCount: rect.map.width,
    rowHeight: getMeasuredCellSize(editor, rect.tableStart + selectedCellPos, "height") ?? rowHeight,
    columnWidth:
      currentColumnWidth ??
      getMeasuredCellSize(editor, rect.tableStart + firstRowCellPos, "width") ??
      DEFAULT_COLUMN_WIDTH,
  }
}

export function setCurrentRowHeight(editor: Editor, height: number) {
  const nextHeight = clamp(height, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT)

  return editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      const rect = selectedRect(state)
      let targetRowOffset: number | null = null

      rect.table.forEach((_rowNode, rowOffset, rowIndex) => {
        if (rowIndex === rect.top) {
          targetRowOffset = rowOffset
        }
      })

      if (targetRowOffset === null) {
        return false
      }

      const rowOffset = targetRowOffset
      const rowNode = rect.table.child(rect.top)
      rowNode.forEach((cellNode, cellOffset) => {
        tr.setNodeMarkup(rect.tableStart + rowOffset + cellOffset, undefined, {
          ...cellNode.attrs,
          rowheight: nextHeight,
        })
      })

      return true
    })
    .fixTables()
    .run()
}

export function setCurrentColumnWidth(editor: Editor, width: number) {
  const nextWidth = clamp(width, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH)

  return editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      const rect = selectedRect(state)
      const firstRowCellPos = rect.map.positionAt(0, rect.left, rect.table)
      const firstRowCell = rect.table.nodeAt(firstRowCellPos)

      if (!firstRowCell) {
        return false
      }

      const firstRowCellRect = rect.map.findCell(firstRowCellPos)
      const widthIndex = rect.left - firstRowCellRect.left
      const colspan = Number(firstRowCell.attrs.colspan ?? 1)
      const currentWidths = Array.isArray(firstRowCell.attrs.colwidth)
        ? [...firstRowCell.attrs.colwidth]
        : Array.from({ length: colspan }, () => DEFAULT_COLUMN_WIDTH)

      while (currentWidths.length < colspan) {
        currentWidths.push(DEFAULT_COLUMN_WIDTH)
      }

      currentWidths[widthIndex] = nextWidth

      tr.setNodeMarkup(rect.tableStart + firstRowCellPos, undefined, {
        ...firstRowCell.attrs,
        colwidth: currentWidths,
      })

      return true
    })
    .fixTables()
    .run()
}
