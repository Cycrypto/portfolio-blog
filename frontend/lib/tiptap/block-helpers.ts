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
