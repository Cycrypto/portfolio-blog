import type { Editor } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { Selection } from "@tiptap/pm/state"
import { TableMap, selectedRect } from "@tiptap/pm/tables"

export const DEFAULT_COLUMN_WIDTH = 180
export const MIN_COLUMN_WIDTH = 80
export const MAX_COLUMN_WIDTH = 480

export interface TableSelectionState {
  row: number
  column: number
  rowCount: number
  columnCount: number
}

export interface TableOverlayAxisHandle {
  index: number
  left?: number
  top?: number
}

export interface TableOverlayGeometry {
  actionButtonLeft: number
  actionButtonTop: number
  addColumnButtonLeft: number
  addColumnButtonTop: number
  addRowButtonLeft: number
  addRowButtonTop: number
  columnCount: number
  columnHandles: TableOverlayAxisHandle[]
  cornerHandleLeft: number
  cornerHandleTop: number
  height: number
  left: number
  rowCount: number
  rowHandles: TableOverlayAxisHandle[]
  tablePos: number
  top: number
  width: number
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

function getTableNodeAtPos(editor: Editor, tablePos: number) {
  const tableNode = editor.state.doc.nodeAt(tablePos)

  if (!tableNode || tableNode.type.name !== "table") {
    return null
  }

  return tableNode
}

function getTablePositionFromCellElement(editor: Editor, cellElement: HTMLElement) {
  try {
    const position = editor.view.posAtDOM(cellElement, 0)
    const $position = editor.state.doc.resolve(position)

    for (let depth = $position.depth; depth > 0; depth -= 1) {
      if ($position.node(depth).type.name === "table") {
        return $position.before(depth)
      }
    }
  } catch {
    return null
  }

  return null
}

function getTableDomElementsByPos(editor: Editor, tablePos: number) {
  const domNode = editor.view.nodeDOM(tablePos)

  if (!(domNode instanceof HTMLElement)) {
    return null
  }

  const wrapperElement = domNode.matches(".tableWrapper")
    ? domNode
    : domNode.closest<HTMLElement>(".tableWrapper") ?? domNode.querySelector<HTMLElement>(".tableWrapper") ?? domNode
  const tableElement = wrapperElement.matches("table")
    ? wrapperElement
    : wrapperElement.querySelector<HTMLTableElement>("table")

  if (!(tableElement instanceof HTMLTableElement)) {
    return null
  }

  return {
    tableElement,
    wrapperElement,
  }
}

function createTableOverlayGeometry(
  editor: Editor,
  frameElement: HTMLElement,
  tablePos: number,
): TableOverlayGeometry | null {
  const tableNode = getTableNodeAtPos(editor, tablePos)
  const tableElements = getTableDomElementsByPos(editor, tablePos)

  if (!tableNode || !tableElements) {
    return null
  }

  const { tableElement, wrapperElement } = tableElements
  const tableMap = TableMap.get(tableNode)
  const frameRect = frameElement.getBoundingClientRect()
  const wrapperRect = wrapperElement.getBoundingClientRect()
  const rows = Array.from(tableElement.rows)

  if (rows.length === 0) {
    return null
  }

  const rowHandles = rows
    .map((row, index) => {
      const rowRect = row.getBoundingClientRect()

      return {
        index,
        top: rowRect.top - frameRect.top + rowRect.height / 2 - 16,
      }
    })
    .filter((handle) => Number.isFinite(handle.top))

  const columnHandles: TableOverlayAxisHandle[] = Array.from({ length: tableMap.width }, (_, index) => {
    const cell = rows[0]?.cells[index]

    if (!cell) {
      return null
    }

    const cellRect = cell.getBoundingClientRect()

    return {
      index,
      left: cellRect.left - frameRect.left + cellRect.width / 2 - 16,
    }
  }).filter(Boolean) as TableOverlayAxisHandle[]

  const left = wrapperRect.left - frameRect.left
  const top = wrapperRect.top - frameRect.top
  const width = wrapperRect.width
  const height = wrapperRect.height

  return {
    actionButtonLeft: Math.max(8, left + width - 32),
    actionButtonTop: Math.max(8, top - 38),
    addColumnButtonLeft: left + width + 12,
    addColumnButtonTop: top + height / 2 - 16,
    addRowButtonLeft: left + width / 2 - 16,
    addRowButtonTop: top + height + 12,
    columnCount: tableMap.width,
    columnHandles,
    cornerHandleLeft: left + width + 10,
    cornerHandleTop: top + height + 10,
    height,
    left,
    rowCount: tableMap.height,
    rowHandles,
    tablePos,
    top,
    width,
  }
}

function selectTableCell(editor: Editor, tablePos: number, row: number, column: number) {
  const tableNode = getTableNodeAtPos(editor, tablePos)

  if (!tableNode) {
    return false
  }

  const tableMap = TableMap.get(tableNode)
  const safeRow = clamp(row, 0, tableMap.height - 1)
  const safeColumn = clamp(column, 0, tableMap.width - 1)
  const cellPos = tableMap.positionAt(safeRow, safeColumn, tableNode)
  const absoluteCellPos = tablePos + 1 + cellPos
  const selection = Selection.near(
    editor.state.doc.resolve(Math.min(absoluteCellPos + 1, editor.state.doc.content.size)),
    1,
  )

  editor.view.dispatch(editor.state.tr.setSelection(selection).scrollIntoView())
  editor.view.focus()
  return true
}

function runTableCommandAt(
  editor: Editor,
  tablePos: number,
  row: number,
  column: number,
  command: () => boolean,
) {
  if (!selectTableCell(editor, tablePos, row, column)) {
    return false
  }

  return command()
}

function isCellMeaningfullyEmpty(cellNode: ProseMirrorNode) {
  let hasContent = false

  cellNode.descendants((node) => {
    if (node.isText && node.text?.trim()) {
      hasContent = true
      return false
    }

    if (!node.isText && node.type.name !== "paragraph" && node.type.name !== "hardBreak") {
      hasContent = true
      return false
    }

    return !hasContent
  })

  return !hasContent
}

function isTrailingRowEmpty(tableNode: ProseMirrorNode, rowIndex: number) {
  const rowNode = tableNode.child(rowIndex)

  for (let index = 0; index < rowNode.childCount; index += 1) {
    if (!isCellMeaningfullyEmpty(rowNode.child(index))) {
      return false
    }
  }

  return true
}

function isTrailingColumnEmpty(tableNode: ProseMirrorNode, columnIndex: number) {
  const tableMap = TableMap.get(tableNode)

  for (let rowIndex = 0; rowIndex < tableMap.height; rowIndex += 1) {
    const cellPos = tableMap.positionAt(rowIndex, columnIndex, tableNode)
    const cellNode = tableNode.nodeAt(cellPos)

    if (!cellNode || !isCellMeaningfullyEmpty(cellNode)) {
      return false
    }
  }

  return true
}

export function getSelectedTablePosition(editor: Editor | null) {
  if (!editor) {
    return null
  }

  const rect = getSelectedTableRect(editor)
  return rect ? rect.tableStart - 1 : null
}

export function getTableSelectionState(editor: Editor | null): TableSelectionState | null {
  if (!editor) {
    return null
  }

  const rect = getSelectedTableRect(editor)
  if (!rect) {
    return null
  }

  return {
    row: rect.top,
    column: rect.left,
    rowCount: rect.map.height,
    columnCount: rect.map.width,
  }
}

export function getTableOverlayGeometryByTablePos(
  editor: Editor,
  frameElement: HTMLElement,
  tablePos: number,
) {
  return createTableOverlayGeometry(editor, frameElement, tablePos)
}

export function getTableOverlayGeometryFromSelection(editor: Editor, frameElement: HTMLElement) {
  const tablePos = getSelectedTablePosition(editor)

  if (tablePos === null) {
    return null
  }

  return createTableOverlayGeometry(editor, frameElement, tablePos)
}

export function getTableOverlayGeometryFromTarget(
  editor: Editor,
  frameElement: HTMLElement,
  target: EventTarget | null,
) {
  if (!(target instanceof HTMLElement)) {
    return null
  }

  const tableElement = target.closest<HTMLTableElement>("table")

  if (!tableElement) {
    return null
  }

  const firstCell = tableElement.querySelector<HTMLElement>("th, td")

  if (!firstCell) {
    return null
  }

  const tablePos = getTablePositionFromCellElement(editor, firstCell)

  if (tablePos === null) {
    return null
  }

  return createTableOverlayGeometry(editor, frameElement, tablePos)
}

export function appendTableRow(editor: Editor, tablePos: number) {
  const tableNode = getTableNodeAtPos(editor, tablePos)

  if (!tableNode) {
    return false
  }

  const tableMap = TableMap.get(tableNode)
  return runTableCommandAt(editor, tablePos, tableMap.height - 1, 0, () => editor.chain().focus().addRowAfter().run())
}

export function appendTableColumn(editor: Editor, tablePos: number) {
  const tableNode = getTableNodeAtPos(editor, tablePos)

  if (!tableNode) {
    return false
  }

  const tableMap = TableMap.get(tableNode)
  return runTableCommandAt(editor, tablePos, 0, tableMap.width - 1, () => editor.chain().focus().addColumnAfter().run())
}

export function insertTableRow(
  editor: Editor,
  tablePos: number,
  row: number,
  placement: "before" | "after",
) {
  return runTableCommandAt(editor, tablePos, row, 0, () =>
    placement === "before"
      ? editor.chain().focus().addRowBefore().run()
      : editor.chain().focus().addRowAfter().run(),
  )
}

export function insertTableColumn(
  editor: Editor,
  tablePos: number,
  column: number,
  placement: "before" | "after",
) {
  return runTableCommandAt(editor, tablePos, 0, column, () =>
    placement === "before"
      ? editor.chain().focus().addColumnBefore().run()
      : editor.chain().focus().addColumnAfter().run(),
  )
}

export function deleteTableRowAt(editor: Editor, tablePos: number, row: number) {
  return runTableCommandAt(editor, tablePos, row, 0, () => editor.chain().focus().deleteRow().run())
}

export function deleteTableColumnAt(editor: Editor, tablePos: number, column: number) {
  return runTableCommandAt(editor, tablePos, 0, column, () => editor.chain().focus().deleteColumn().run())
}

export function toggleTableHeaderRow(editor: Editor, tablePos: number) {
  return runTableCommandAt(editor, tablePos, 0, 0, () => editor.chain().focus().toggleHeaderRow().run())
}

export function toggleTableHeaderColumn(editor: Editor, tablePos: number) {
  return runTableCommandAt(editor, tablePos, 0, 0, () => editor.chain().focus().toggleHeaderColumn().run())
}

export function deleteTableAt(editor: Editor, tablePos: number) {
  return runTableCommandAt(editor, tablePos, 0, 0, () => editor.chain().focus().deleteTable().run())
}

function trimTrailingRows(editor: Editor, tablePos: number, targetRowCount: number) {
  let changed = false

  while (true) {
    const tableNode = getTableNodeAtPos(editor, tablePos)

    if (!tableNode) {
      return changed
    }

    const tableMap = TableMap.get(tableNode)

    if (tableMap.height <= targetRowCount) {
      return changed
    }

    const lastRowIndex = tableMap.height - 1

    if (!isTrailingRowEmpty(tableNode, lastRowIndex)) {
      return changed
    }

    if (!deleteTableRowAt(editor, tablePos, lastRowIndex)) {
      return changed
    }

    changed = true
  }
}

function trimTrailingColumns(editor: Editor, tablePos: number, targetColumnCount: number) {
  let changed = false

  while (true) {
    const tableNode = getTableNodeAtPos(editor, tablePos)

    if (!tableNode) {
      return changed
    }

    const tableMap = TableMap.get(tableNode)

    if (tableMap.width <= targetColumnCount) {
      return changed
    }

    const lastColumnIndex = tableMap.width - 1

    if (!isTrailingColumnEmpty(tableNode, lastColumnIndex)) {
      return changed
    }

    if (!deleteTableColumnAt(editor, tablePos, lastColumnIndex)) {
      return changed
    }

    changed = true
  }
}

export function applyTableCornerResize(
  editor: Editor,
  tablePos: number,
  targetRowCount: number,
  targetColumnCount: number,
) {
  let changed = false

  while (true) {
    const tableNode = getTableNodeAtPos(editor, tablePos)

    if (!tableNode) {
      return changed
    }

    const tableMap = TableMap.get(tableNode)

    if (tableMap.height >= targetRowCount) {
      break
    }

    if (!appendTableRow(editor, tablePos)) {
      break
    }

    changed = true
  }

  while (true) {
    const tableNode = getTableNodeAtPos(editor, tablePos)

    if (!tableNode) {
      return changed
    }

    const tableMap = TableMap.get(tableNode)

    if (tableMap.width >= targetColumnCount) {
      break
    }

    if (!appendTableColumn(editor, tablePos)) {
      break
    }

    changed = true
  }

  if (trimTrailingRows(editor, tablePos, Math.max(1, targetRowCount))) {
    changed = true
  }

  if (trimTrailingColumns(editor, tablePos, Math.max(1, targetColumnCount))) {
    changed = true
  }

  return changed
}
