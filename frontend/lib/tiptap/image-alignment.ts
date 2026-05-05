import type { Editor } from "@tiptap/core"
import { NodeSelection } from "@tiptap/pm/state"
import { getTopLevelBlockFromSelection } from "@/lib/tiptap/block-helpers"

export type ImageAlignment = "left" | "center" | "right"
export type BlockAlignment = ImageAlignment | "justify"

const IMAGE_ALIGNMENTS = new Set<ImageAlignment>(["left", "center", "right"])

export function normalizeImageAlignment(value: unknown): ImageAlignment {
  return typeof value === "string" && IMAGE_ALIGNMENTS.has(value as ImageAlignment)
    ? (value as ImageAlignment)
    : "left"
}

function getSelectedImageBlock(editor: Editor) {
  const block = getTopLevelBlockFromSelection(editor)

  if (block?.node.type.name !== "image") {
    return null
  }

  return block
}

export function isImageAlignmentActive(editor: Editor, alignment: ImageAlignment) {
  const imageBlock = getSelectedImageBlock(editor)

  if (!imageBlock) {
    return false
  }

  return normalizeImageAlignment(imageBlock.node.attrs.textAlign) === alignment
}

export function isBlockAlignmentActive(editor: Editor, alignment: BlockAlignment) {
  if (alignment !== "justify" && getSelectedImageBlock(editor)) {
    return isImageAlignmentActive(editor, alignment)
  }

  return editor.isActive({ textAlign: alignment })
}

export function setImageAlignment(editor: Editor, alignment: ImageAlignment) {
  const imageBlock = getSelectedImageBlock(editor)

  if (!imageBlock) {
    return false
  }

  const transaction = editor.state.tr.setNodeMarkup(imageBlock.from, undefined, {
    ...imageBlock.node.attrs,
    textAlign: alignment === "left" ? null : alignment,
  })

  transaction.setSelection(NodeSelection.create(transaction.doc, imageBlock.from))
  editor.view.dispatch(transaction.scrollIntoView())
  editor.view.focus()

  return true
}

export function setBlockAlignment(editor: Editor, alignment: BlockAlignment) {
  if (alignment !== "justify" && setImageAlignment(editor, alignment)) {
    return
  }

  editor.chain().focus().setTextAlign(alignment).run()
}
