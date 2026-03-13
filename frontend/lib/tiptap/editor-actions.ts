import type { Editor } from "@tiptap/core"
import type { LucideIcon } from "lucide-react"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Code2,
  Heading1,
  Heading2,
  ImageIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Save,
  Settings2,
  Table as TableIcon,
  Type,
  Video,
} from "lucide-react"

export type InsertDialogMode = "image" | "link" | "math" | "youtube"
export type EditorActionSurface = "floating" | "slash" | "palette" | "block"
export type EditorActionGroup = "기본" | "삽입" | "미디어" | "정렬" | "문서"

export interface EditorDocumentActions {
  openSettings?: () => void
  saveDraft?: () => void | Promise<void>
}

export interface EditorActionContext {
  documentActions?: EditorDocumentActions
  editor: Editor
  insertTable: () => void
  openImagePicker: () => void
  openInsertDialog: (mode: InsertDialogMode) => void
}

export interface EditorAction {
  description: string
  group: EditorActionGroup
  icon: LucideIcon
  id: string
  keywords?: string[]
  run: (context: EditorActionContext) => void
  shortcut?: string
  surfaces: EditorActionSurface[]
  title: string
  isActive?: (editor: Editor) => boolean
  isVisible?: (context: EditorActionContext) => boolean
}

const GROUP_ORDER: EditorActionGroup[] = ["기본", "삽입", "미디어", "정렬", "문서"]

export const EDITOR_ACTIONS: EditorAction[] = [
  {
    id: "paragraph",
    title: "기본 텍스트",
    description: "현재 블록을 일반 문단으로 바꿉니다.",
    group: "기본",
    icon: Type,
    keywords: ["paragraph", "text", "본문"],
    surfaces: ["slash", "palette", "block"],
    isActive: (editor) => editor.isActive("paragraph"),
    run: ({ editor }) => {
      editor.chain().focus().setParagraph().run()
    },
  },
  {
    id: "heading-1",
    title: "제목 1",
    description: "가장 큰 제목 블록으로 바꿉니다.",
    group: "기본",
    icon: Heading1,
    keywords: ["h1", "heading", "title", "제목"],
    surfaces: ["floating", "slash", "palette", "block"],
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    run: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
  },
  {
    id: "heading-2",
    title: "제목 2",
    description: "중간 크기 제목 블록으로 바꿉니다.",
    group: "기본",
    icon: Heading2,
    keywords: ["h2", "heading", "subtitle", "제목"],
    surfaces: ["floating", "slash", "palette", "block"],
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    run: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
  },
  {
    id: "bullet-list",
    title: "불릿 리스트",
    description: "점 목록 블록으로 바꿉니다.",
    group: "기본",
    icon: List,
    keywords: ["unordered", "bullet", "list", "목록"],
    surfaces: ["floating", "slash", "palette", "block"],
    isActive: (editor) => editor.isActive("bulletList"),
    run: ({ editor }) => {
      editor.chain().focus().toggleBulletList().run()
    },
  },
  {
    id: "ordered-list",
    title: "번호 리스트",
    description: "숫자 목록 블록으로 바꿉니다.",
    group: "기본",
    icon: ListOrdered,
    keywords: ["ordered", "numbered", "list", "번호", "목록"],
    surfaces: ["floating", "slash", "palette", "block"],
    isActive: (editor) => editor.isActive("orderedList"),
    run: ({ editor }) => {
      editor.chain().focus().toggleOrderedList().run()
    },
  },
  {
    id: "task-list",
    title: "체크리스트",
    description: "체크 가능한 할 일 목록을 만듭니다.",
    group: "기본",
    icon: ListTodo,
    keywords: ["task", "todo", "checklist", "체크", "할일"],
    surfaces: ["floating", "slash", "palette", "block"],
    isActive: (editor) => editor.isActive("taskList"),
    run: ({ editor }) => {
      editor.chain().focus().toggleTaskList().run()
    },
  },
  {
    id: "blockquote",
    title: "인용문",
    description: "인용 블록으로 바꿉니다.",
    group: "기본",
    icon: Quote,
    keywords: ["quote", "blockquote", "인용"],
    surfaces: ["floating", "slash", "palette", "block"],
    isActive: (editor) => editor.isActive("blockquote"),
    run: ({ editor }) => {
      editor.chain().focus().toggleBlockquote().run()
    },
  },
  {
    id: "code-block",
    title: "코드 블록",
    description: "코드 블록을 삽입하거나 현재 블록을 코드 블록으로 바꿉니다.",
    group: "삽입",
    icon: Code2,
    keywords: ["code", "snippet", "코드"],
    surfaces: ["floating", "slash", "palette", "block"],
    isActive: (editor) => editor.isActive("codeBlock"),
    run: ({ editor }) => {
      editor.chain().focus().toggleCodeBlock().run()
    },
  },
  {
    id: "divider",
    title: "구분선",
    description: "가로 구분선을 삽입합니다.",
    group: "삽입",
    icon: Minus,
    keywords: ["divider", "horizontal rule", "hr", "구분선"],
    surfaces: ["floating", "slash", "palette", "block"],
    run: ({ editor }) => {
      editor.chain().focus().setHorizontalRule().run()
    },
  },
  {
    id: "image-upload",
    title: "이미지 업로드",
    description: "로컬 이미지를 업로드해서 현재 위치에 삽입합니다.",
    group: "미디어",
    icon: ImageIcon,
    keywords: ["image", "upload", "photo", "그림", "이미지"],
    surfaces: ["floating", "slash", "palette", "block"],
    run: ({ openImagePicker }) => {
      openImagePicker()
    },
  },
  {
    id: "table",
    title: "표",
    description: "3x3 표를 삽입합니다.",
    group: "삽입",
    icon: TableIcon,
    keywords: ["table", "grid", "표"],
    surfaces: ["slash", "palette", "block"],
    run: ({ insertTable }) => {
      insertTable()
    },
  },
  {
    id: "math",
    title: "수식",
    description: "LaTeX 기반 수식을 삽입합니다.",
    group: "미디어",
    icon: Code2,
    keywords: ["math", "latex", "equation", "수식"],
    surfaces: ["slash", "palette", "block"],
    run: ({ openInsertDialog }) => {
      openInsertDialog("math")
    },
  },
  {
    id: "youtube",
    title: "YouTube",
    description: "YouTube 링크를 임베드 블록으로 삽입합니다.",
    group: "미디어",
    icon: Video,
    keywords: ["youtube", "video", "embed", "영상"],
    surfaces: ["slash", "palette", "block"],
    run: ({ openInsertDialog }) => {
      openInsertDialog("youtube")
    },
  },
  {
    id: "align-left",
    title: "왼쪽 정렬",
    description: "현재 블록을 왼쪽 정렬로 바꿉니다.",
    group: "정렬",
    icon: AlignLeft,
    keywords: ["align", "left", "정렬", "왼쪽"],
    surfaces: ["palette", "block"],
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
    run: ({ editor }) => {
      editor.chain().focus().setTextAlign("left").run()
    },
  },
  {
    id: "align-center",
    title: "가운데 정렬",
    description: "현재 블록을 가운데 정렬로 바꿉니다.",
    group: "정렬",
    icon: AlignCenter,
    keywords: ["align", "center", "정렬", "가운데"],
    surfaces: ["palette", "block"],
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
    run: ({ editor }) => {
      editor.chain().focus().setTextAlign("center").run()
    },
  },
  {
    id: "align-right",
    title: "오른쪽 정렬",
    description: "현재 블록을 오른쪽 정렬로 바꿉니다.",
    group: "정렬",
    icon: AlignRight,
    keywords: ["align", "right", "정렬", "오른쪽"],
    surfaces: ["palette", "block"],
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
    run: ({ editor }) => {
      editor.chain().focus().setTextAlign("right").run()
    },
  },
  {
    id: "align-justify",
    title: "양쪽 정렬",
    description: "현재 블록을 양쪽 정렬로 바꿉니다.",
    group: "정렬",
    icon: AlignJustify,
    keywords: ["align", "justify", "정렬", "양쪽"],
    surfaces: ["palette", "block"],
    isActive: (editor) => editor.isActive({ textAlign: "justify" }),
    run: ({ editor }) => {
      editor.chain().focus().setTextAlign("justify").run()
    },
  },
  {
    id: "save-draft",
    title: "임시저장",
    description: "현재 작성 중인 문서를 임시저장합니다.",
    group: "문서",
    icon: Save,
    keywords: ["save", "draft", "임시저장"],
    shortcut: "Cmd/Ctrl+S",
    surfaces: ["palette"],
    isVisible: ({ documentActions }) => Boolean(documentActions?.saveDraft),
    run: ({ documentActions }) => {
      void documentActions?.saveDraft?.()
    },
  },
  {
    id: "open-settings",
    title: "게시 설정",
    description: "태그, 카테고리, 대표 이미지를 설정합니다.",
    group: "문서",
    icon: Settings2,
    keywords: ["settings", "publish", "meta", "설정"],
    surfaces: ["palette"],
    isVisible: ({ documentActions }) => Boolean(documentActions?.openSettings),
    run: ({ documentActions }) => {
      documentActions?.openSettings?.()
    },
  },
]

export function getActionsForSurface(
  actions: EditorAction[],
  context: EditorActionContext,
  surface: EditorActionSurface,
) {
  return actions.filter((action) => {
    if (!action.surfaces.includes(surface)) {
      return false
    }

    if (action.isVisible && !action.isVisible(context)) {
      return false
    }

    return true
  })
}

export function filterEditorActions(actions: EditorAction[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return actions
  }

  const terms = normalizedQuery.split(/\s+/)

  return actions.filter((action) => {
    const haystack = [
      action.title,
      action.description,
      ...(action.keywords || []),
    ]
      .join(" ")
      .toLowerCase()

    return terms.every((term) => haystack.includes(term))
  })
}

export function groupEditorActions(actions: EditorAction[]) {
  const grouped = new Map<EditorActionGroup, EditorAction[]>()

  for (const action of actions) {
    const bucket = grouped.get(action.group) || []
    bucket.push(action)
    grouped.set(action.group, bucket)
  }

  return GROUP_ORDER
    .map((group) => ({
      group,
      actions: grouped.get(group) || [],
    }))
    .filter(({ actions }) => actions.length > 0)
}
