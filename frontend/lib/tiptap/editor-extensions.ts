import StarterKit from "@tiptap/starter-kit"
import { InputRule, findParentNode, wrappingInputRule } from "@tiptap/core"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Highlight from "@tiptap/extension-highlight"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Typography from "@tiptap/extension-typography"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import Placeholder from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { lowlight } from "lowlight"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { ResizableImage } from "./resizable-image.tsx"
import Mathematics from "@tiptap/extension-mathematics"
import Youtube from "@tiptap/extension-youtube"
import TextAlign from "@tiptap/extension-text-align"

const taskItemInputRegex = /^\s*(\[( |x|X)\])\s$/

const MarkdownFriendlyTaskItem = TaskItem.extend({
  addInputRules() {
    return [
      new InputRule({
        find: taskItemInputRegex,
        handler: ({ state, range, match, chain }) => {
          const parentListItem = findParentNode((node) => node.type.name === "listItem")(state.selection)
          const parentBulletList = findParentNode((node) => node.type.name === "bulletList")(state.selection)

          if (!parentListItem || !parentBulletList) {
            return null
          }

          const checked = String(match[2]).toLowerCase() === "x"

          chain()
            .deleteRange(range)
            .toggleTaskList()
            .command(({ tr, state: nextState }) => {
              const taskItem = findParentNode((node) => node.type.name === "taskItem")(nextState.selection)

              if (!taskItem) {
                return false
              }

              tr.setNodeMarkup(taskItem.pos, undefined, {
                ...taskItem.node.attrs,
                checked,
              })

              return true
            })
            .run()
        },
      }),
      wrappingInputRule({
        find: taskItemInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          checked: String(match[2]).toLowerCase() === "x",
        }),
      }),
    ]
  },
})

export function getEditorExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false,
      horizontalRule: false,
      heading: {
        levels: [1, 2, 3, 4],
      },
    }),
    Underline,
    Highlight,
    Typography,
    HorizontalRule,
    TaskList,
    MarkdownFriendlyTaskItem.configure({
      nested: true,
    }),
    TextStyle,
    Color.configure({
      types: ["textStyle"],
    }),
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({
      placeholder: "Type / to browse options",
    }),
    ResizableImage.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: "rounded-lg max-w-full h-auto my-4",
        loading: "lazy",
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-blue-600 underline hover:text-blue-800",
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Mathematics.configure({
      katexOptions: {
        throwOnError: false,
      },
    }),
    Youtube.configure({
      controls: true,
      nocookie: true,
      HTMLAttributes: {
        class: "youtube-embed",
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
    }),
  ]
}
