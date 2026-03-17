import type { Editor } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { Selection, TextSelection } from "@tiptap/pm/state"

export interface TopLevelBlockRange {
  from: number
  index: number
  node: ProseMirrorNode
  to: number
}

interface TopLevelBlockHit {
  block: TopLevelBlockRange
  element: HTMLElement
}

interface BlockCoordinates {
  clientX: number
  clientY: number
}

function getFirstTextSelectionPos(node: ProseMirrorNode, startPos: number): number | null {
  if (node.isTextblock) {
    return Math.min(startPos + 1, startPos + node.nodeSize - 1)
  }

  let offset = 1

  for (let index = 0; index < node.childCount; index += 1) {
    const child = node.child(index)
    const childPos = startPos + offset
    const nestedTextPos = getFirstTextSelectionPos(child, childPos)

    if (nestedTextPos !== null) {
      return nestedTextPos
    }

    offset += child.nodeSize
  }

  return null
}

function dispatchAndFocus(editor: Editor, selection: Selection) {
  const transaction = editor.state.tr.setSelection(selection).scrollIntoView()
  editor.view.dispatch(transaction)
  editor.view.focus()
}

function cloneNode(node: ProseMirrorNode) {
  return node.type.schema.nodeFromJSON(node.toJSON())
}

function getTopLevelBlockByIndexFromDoc(doc: ProseMirrorNode, index: number): TopLevelBlockRange | null {
  if (index < 0 || index >= doc.childCount) {
    return null
  }

  let from = 0

  for (let currentIndex = 0; currentIndex < index; currentIndex += 1) {
    from += doc.child(currentIndex).nodeSize
  }

  const node = doc.child(index)

  return {
    from,
    index,
    node,
    to: from + node.nodeSize,
  }
}

function getTopLevelBlockAtPosFromDoc(doc: ProseMirrorNode, pos: number): TopLevelBlockRange | null {
  let from = 0

  for (let index = 0; index < doc.childCount; index += 1) {
    const node = doc.child(index)
    const to = from + node.nodeSize

    if (pos >= from && pos <= to) {
      return {
        from,
        index,
        node,
        to,
      }
    }

    from = to
  }

  return null
}

function getTopLevelBlockSelection(editor: Editor, block: TopLevelBlockRange) {
  const textPos = getFirstTextSelectionPos(block.node, block.from)

  if (textPos !== null) {
    return TextSelection.create(editor.state.doc, textPos)
  }

  return Selection.near(editor.state.doc.resolve(Math.min(block.to, editor.state.doc.content.size)), -1)
}

export function canTransformTopLevelBlock(block: TopLevelBlockRange) {
  return getFirstTextSelectionPos(block.node, block.from) !== null
}

export function focusTopLevelBlock(editor: Editor, block: TopLevelBlockRange) {
  dispatchAndFocus(editor, getTopLevelBlockSelection(editor, block))
}

export function focusAfterTopLevelBlock(editor: Editor, block: TopLevelBlockRange) {
  dispatchAndFocus(
    editor,
    Selection.near(editor.state.doc.resolve(Math.min(block.to, editor.state.doc.content.size)), 1),
  )
}

export function getTopLevelBlockByIndex(editor: Editor, index: number): TopLevelBlockRange | null {
  return getTopLevelBlockByIndexFromDoc(editor.state.doc, index)
}

export function getTopLevelBlockFromSelection(editor: Editor) {
  return getTopLevelBlockAtPosFromDoc(editor.state.doc, editor.state.selection.from)
}

export function getTopLevelBlockFromTarget(editor: Editor, target: EventTarget | null): TopLevelBlockHit | null {
  if (!(target instanceof Node)) {
    return null
  }

  const children = Array.from(editor.view.dom.children)
  const blockIndex = children.findIndex((child) => child.contains(target))

  if (blockIndex === -1) {
    return null
  }

  const block = getTopLevelBlockByIndex(editor, blockIndex)
  const element = children[blockIndex]

  if (!block || !(element instanceof HTMLElement)) {
    return null
  }

  return {
    block,
    element,
  }
}

export function getTopLevelBlockAtCoords(editor: Editor, coordinates: BlockCoordinates): TopLevelBlockHit | null {
  const children = Array.from(editor.view.dom.children)
  let bestHit: TopLevelBlockHit | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  children.forEach((child, index) => {
    if (!(child instanceof HTMLElement)) {
      return
    }

    const rect = child.getBoundingClientRect()
    const withinHorizontalReach =
      coordinates.clientX >= rect.left - 84 &&
      coordinates.clientX <= rect.right + 24

    if (!withinHorizontalReach) {
      return
    }

    let verticalDistance = 0

    if (coordinates.clientY < rect.top) {
      verticalDistance = rect.top - coordinates.clientY
    } else if (coordinates.clientY > rect.bottom) {
      verticalDistance = coordinates.clientY - rect.bottom
    }

    if (verticalDistance > 28 || verticalDistance >= bestDistance) {
      return
    }

    const block = getTopLevelBlockByIndex(editor, index)

    if (!block) {
      return
    }

    bestHit = {
      block,
      element: child,
    }
    bestDistance = verticalDistance
  })

  return bestHit
}

export function duplicateTopLevelBlock(editor: Editor, block: TopLevelBlockRange) {
  const duplicatedNode = cloneNode(block.node)
  const transaction = editor.state.tr.insert(block.to, duplicatedNode)
  const duplicatedBlock = getTopLevelBlockByIndexFromDoc(transaction.doc, block.index + 1)

  if (duplicatedBlock) {
    const textPos = getFirstTextSelectionPos(duplicatedBlock.node, duplicatedBlock.from)
    if (textPos !== null) {
      transaction.setSelection(TextSelection.create(transaction.doc, textPos))
    } else {
      transaction.setSelection(
        Selection.near(transaction.doc.resolve(Math.min(duplicatedBlock.to, transaction.doc.content.size)), -1),
      )
    }
  }

  editor.view.dispatch(transaction.scrollIntoView())
  editor.view.focus()
}

export function deleteTopLevelBlock(editor: Editor, block: TopLevelBlockRange) {
  const paragraph = editor.state.schema.nodes.paragraph?.createAndFill()

  if (!paragraph) {
    return
  }

  if (editor.state.doc.childCount === 1) {
    const transaction = editor.state.tr.replaceWith(block.from, block.to, paragraph)
    transaction.setSelection(TextSelection.create(transaction.doc, 1))
    editor.view.dispatch(transaction.scrollIntoView())
    editor.view.focus()
    return
  }

  const transaction = editor.state.tr.delete(block.from, block.to)
  const fallbackPos = Math.min(block.from, transaction.doc.content.size)
  transaction.setSelection(Selection.near(transaction.doc.resolve(fallbackPos), 1))
  editor.view.dispatch(transaction.scrollIntoView())
  editor.view.focus()
}

export function insertParagraphBelowTopLevelBlock(editor: Editor, block: TopLevelBlockRange) {
  const paragraph = editor.state.schema.nodes.paragraph?.createAndFill()

  if (!paragraph) {
    return
  }

  const transaction = editor.state.tr.insert(block.to, paragraph)
  transaction.setSelection(TextSelection.create(transaction.doc, Math.min(block.to + 1, transaction.doc.content.size)))
  editor.view.dispatch(transaction.scrollIntoView())
  editor.view.focus()
}

export function moveTopLevelBlock(
  editor: Editor,
  sourceIndex: number,
  targetIndex: number,
  placement: "before" | "after",
) {
  const sourceBlock = getTopLevelBlockByIndex(editor, sourceIndex)

  if (!sourceBlock) {
    return
  }

  let insertIndex = placement === "before" ? targetIndex : targetIndex + 1

  if (
    sourceIndex === targetIndex ||
    (placement === "after" && sourceIndex === targetIndex + 1) ||
    (placement === "before" && sourceIndex + 1 === targetIndex)
  ) {
    return
  }

  const transaction = editor.state.tr
  const movedNode = cloneNode(sourceBlock.node)

  transaction.delete(sourceBlock.from, sourceBlock.to)

  if (sourceIndex < insertIndex) {
    insertIndex -= 1
  }

  insertIndex = Math.max(0, Math.min(insertIndex, transaction.doc.childCount))

  let insertPos = 0
  for (let index = 0; index < insertIndex; index += 1) {
    insertPos += transaction.doc.child(index).nodeSize
  }

  transaction.insert(insertPos, movedNode)

  const movedBlock = getTopLevelBlockByIndexFromDoc(transaction.doc, insertIndex)
  if (movedBlock) {
    const textPos = getFirstTextSelectionPos(movedBlock.node, movedBlock.from)
    if (textPos !== null) {
      transaction.setSelection(TextSelection.create(transaction.doc, textPos))
    } else {
      transaction.setSelection(
        Selection.near(transaction.doc.resolve(Math.min(movedBlock.to, transaction.doc.content.size)), -1),
      )
    }
  }

  editor.view.dispatch(transaction.scrollIntoView())
  editor.view.focus()
}
