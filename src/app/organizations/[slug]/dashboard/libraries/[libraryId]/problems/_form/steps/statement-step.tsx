"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useEditor, useEditorState, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapLink from "@tiptap/extension-link"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { Underline } from "@tiptap/extension-underline"
import { Highlight } from "@tiptap/extension-highlight"
import { Placeholder } from "@tiptap/extension-placeholder"
import { TextStyle, Color, FontFamily } from "@tiptap/extension-text-style"

/** Color extension with !important so text color isn't overridden by Tailwind utilities */
const ColorWithPriority = Color.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: (element) => {
              const styleAttr = element.getAttribute("style")
              if (styleAttr) {
                const decls = styleAttr.split(";").map((s) => s.trim()).filter(Boolean)
                for (let i = decls.length - 1; i >= 0; i -= 1) {
                  const parts = decls[i].split(":")
                  if (parts.length >= 2) {
                    const prop = parts[0].trim().toLowerCase()
                    const val = parts.slice(1).join(":").trim()
                    if (prop === "color") return val.replace(/['"]+/g, "")
                  }
                }
              }
              return element.style?.color?.replace(/['"]+/g, "") ?? null
            },
            renderHTML: (attributes) => {
              if (!attributes.color) return {}
              return { style: `color: ${attributes.color} !important` }
            },
          },
        },
      },
    ]
  },
})
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { TableKit } from "@tiptap/extension-table"
import { Mathematics } from "@tiptap/extension-mathematics"
import { MermaidDiagram } from "../mermaid-extension"
import { MafsGraph } from "../mafs-extension"
import { MafsGraphRenderer } from "../mafs-graph-renderer"
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
  ListTodo,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Sigma,
  Square,
  Braces,
  Code,
  Quote,
  Minus,
  Link2,
  Unlink,
  Table2,
  Palette,
  Eye,
  Maximize2,
  Minimize2,
  CaseSensitive,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  LayoutTemplate,
  Workflow,
  LineChart,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { MetadataFormValues } from "../types"
import { MATH_SYMBOLS } from "../math-symbols"
import "katex/dist/katex.min.css"

function parseStatement(value: string | null | undefined): object | string | null {
  if (!value || value.trim() === "") return null
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === "object" && "type" in parsed) return parsed
    return null
  } catch {
    return value
  }
}

const OJ_TEMPLATES = [
  { id: "input", label: "Input format", icon: "→" },
  { id: "output", label: "Output format", icon: "←" },
  { id: "constraints", label: "Constraints", icon: "≤" },
  { id: "sample", label: "Sample I/O", icon: "⊞" },
] as const

const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Geist Sans", value: "var(--font-geist-sans), system-ui, sans-serif" },
  { label: "System UI", value: "system-ui, -apple-system, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Monospace", value: "var(--font-geist-mono), ui-monospace, monospace" },
] as const

import { StatementPreview } from "@/components/statement-preview"

interface StatementEditorProps {
  value: string
  onChange: (value: string) => void
}

function StatementEditor({ value, onChange }: StatementEditorProps) {
  const [mathDialogOpen, setMathDialogOpen] = useState(false)
  const [mathLatex, setMathLatex] = useState("")
  const [mathMode, setMathMode] = useState<"inline" | "block">("inline")
  const mathPosRef = useRef<number | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const colorSelectionRef = useRef<{ from: number; to: number } | null>(null)
  const fontSelectionRef = useRef<{ from: number; to: number } | null>(null)
  const templateSelectionRef = useRef<number | null>(null)
  const mathSymbolsSelectionRef = useRef<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editorFullscreen, setEditorFullscreen] = useState(false)
  const [toolbarSearchOpen, setToolbarSearchOpen] = useState(false)
  const [mathSymbolsOpen, setMathSymbolsOpen] = useState(false)
  const [mermaidDialogOpen, setMermaidDialogOpen] = useState(false)
  const [mermaidDiagram, setMermaidDiagram] = useState("graph TD\n  A --> B")
  const mermaidPosRef = useRef<number | null>(null)
  const [mafsGraphDialogOpen, setMafsGraphDialogOpen] = useState(false)
  const [mafsGraphConfig, setMafsGraphConfig] = useState(
    () =>
      JSON.stringify(
        {
          expressions: ["x^2"],
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          equalScale: true,
          subdivisions: 5,
          showLabels: true,
        },
        null,
        2
      )
  )
  const mafsGraphPosRef = useRef<number | null>(null)

  const initialContent = parseStatement(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "font-mono text-sm" } },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline underline-offset-2 hover:no-underline" },
      }),
      TaskList,
      TaskItem.configure({ nested: true, HTMLAttributes: { class: "flex items-start gap-2" } }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: "Start writing your problem statement…" }),
      Subscript,
      Superscript,
      TextStyle,
      ColorWithPriority,
      FontFamily,
      TableKit.configure({
        table: { resizable: false },
        tableCell: { HTMLAttributes: { class: "border border-border p-2 align-top" } },
        tableHeader: { HTMLAttributes: { class: "border border-border p-2 align-top font-semibold bg-muted/50" } },
      }),
      Mathematics.configure({
        katexOptions: { throwOnError: false },
        inlineOptions: {
          onClick: (_node, pos) => {
            mathPosRef.current = pos
            setMathLatex(_node.attrs.latex ?? "")
            setMathMode("inline")
            setMathDialogOpen(true)
          },
        },
        blockOptions: {
          onClick: (_node, pos) => {
            mathPosRef.current = pos
            setMathLatex(_node.attrs.latex ?? "")
            setMathMode("block")
            setMathDialogOpen(true)
          },
        },
      }),
      MermaidDiagram.configure({
        onClick: (_node, pos) => {
          mermaidPosRef.current = pos
          setMermaidDiagram(_node.attrs.diagram ?? "graph TD\n  A --> B")
          setMermaidDialogOpen(true)
        },
      }),
      MafsGraph.configure({
        onClick: (_node, pos) => {
          mafsGraphPosRef.current = pos
          try {
            const cfg = JSON.parse(_node.attrs.config ?? "{}")
            setMafsGraphConfig(
              JSON.stringify(
                {
                  expressions: cfg.expressions ?? ["x^2"],
                  xMin: cfg.xMin ?? -5,
                  xMax: cfg.xMax ?? 5,
                  yMin: cfg.yMin ?? -5,
                  yMax: cfg.yMax ?? 5,
                  equalScale: cfg.equalScale ?? true,
                  subdivisions: cfg.subdivisions ?? 5,
                  showLabels: cfg.showLabels ?? true,
                },
                null,
                2
              )
            )
          } catch {
            setMafsGraphConfig(
              JSON.stringify(
                {
                  expressions: ["x^2"],
                  xMin: -5,
                  xMax: 5,
                  yMin: -5,
                  yMax: 5,
                  equalScale: true,
                  subdivisions: 5,
                  showLabels: true,
                },
                null,
                2
              )
            )
          }
          setMafsGraphDialogOpen(true)
        },
      }),
    ],
    content: initialContent ?? undefined,
    editorProps: {
      attributes: {
        class:
          "min-h-[min(500px,75vh)] px-6 sm:px-12 py-8 sm:py-12 text-[15px] leading-[1.7] focus:outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_pre]:bg-muted/80 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_code]:bg-muted/80 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-muted-foreground [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-900/50 [&_mark]:rounded [&_mark]:px-0.5 [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2 [&_li[data-type=taskItem]>label]:flex [&_li[data-type=taskItem]>label]:shrink-0 [&_li[data-type=taskItem]>label]:cursor-pointer [&_li[data-type=taskItem]_input]:mt-0.5 [&_li[data-type=taskItem]>div]:min-w-0 [&_li[data-type=taskItem]>div>p:first-child]:!mt-0",
      },
      handleDOMEvents: {
        paste: (view, event) => {
          const html = event.clipboardData?.getData("text/html")
          if (html) return false
          return false
        },
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      if (json && json.type === "doc") {
        onChange(JSON.stringify(json))
      }
    },
  })

  const active = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        strike: ed.isActive("strike"),
        highlight: ed.isActive("highlight"),
        code: ed.isActive("code"),
        subscript: ed.isActive("subscript"),
        superscript: ed.isActive("superscript"),
        heading1: ed.isActive("heading", { level: 1 }),
        heading2: ed.isActive("heading", { level: 2 }),
        heading3: ed.isActive("heading", { level: 3 }),
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
        taskList: ed.isActive("taskList"),
        blockquote: ed.isActive("blockquote"),
        codeBlock: ed.isActive("codeBlock"),
        link: ed.isActive("link"),
        table: ed.isActive("table"),
      }
    },
  })

  useEffect(() => {
    if (!editor) return
    const parsed = parseStatement(value)
    if (!parsed) {
      if (editor.isEmpty) return
      editor.commands.clearContent()
      return
    }
    if (typeof parsed === "object") {
      const current = editor.getJSON()
      if (JSON.stringify(current) !== JSON.stringify(parsed)) {
        editor.commands.setContent(parsed, { emitUpdate: false })
      }
    }
  }, [value, editor])

  const openInsertMath = useCallback((mode: "inline" | "block") => {
    setMathLatex("")
    setMathMode(mode)
    mathPosRef.current = null
    setMathDialogOpen(true)
  }, [])

  const openInsertMermaid = useCallback(() => {
    setMermaidDiagram("graph TD\n  A --> B")
    mermaidPosRef.current = null
    setMermaidDialogOpen(true)
  }, [])

  const openInsertMafsGraph = useCallback(() => {
    setMafsGraphConfig(
      JSON.stringify(
        {
          expressions: ["x^2"],
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          equalScale: true,
          subdivisions: 5,
          showLabels: true,
        },
        null,
        2
      )
    )
    mafsGraphPosRef.current = null
    setMafsGraphDialogOpen(true)
  }, [])

  const applyMermaid = useCallback(() => {
    if (!editor) return
    const pos = mermaidPosRef.current
    if (pos !== null) {
      editor.chain().focus().updateMermaidDiagram({ diagram: mermaidDiagram, pos }).run()
    } else {
      editor.chain().focus().insertMermaidDiagram({ diagram: mermaidDiagram }).run()
    }
    setMermaidDialogOpen(false)
    setMermaidDiagram("graph TD\n  A --> B")
    mermaidPosRef.current = null
  }, [editor, mermaidDiagram])

  const applyMafsGraph = useCallback(() => {
    if (!editor) return
    let config: string
    try {
      const parsed = JSON.parse(mafsGraphConfig)
      config = JSON.stringify({
        expressions: Array.isArray(parsed.expressions)
          ? parsed.expressions.filter(Boolean)
          : ["x^2"],
        xMin: typeof parsed.xMin === "number" ? parsed.xMin : -5,
        xMax: typeof parsed.xMax === "number" ? parsed.xMax : 5,
        yMin: typeof parsed.yMin === "number" ? parsed.yMin : -5,
        yMax: typeof parsed.yMax === "number" ? parsed.yMax : 5,
        equalScale: parsed.equalScale !== false,
        subdivisions: typeof parsed.subdivisions === "number" ? parsed.subdivisions : 5,
        showLabels: parsed.showLabels !== false,
      })
    } catch {
      config = JSON.stringify({
        expressions: ["x^2"],
        xMin: -5,
        xMax: 5,
        yMin: -5,
        yMax: 5,
        equalScale: true,
        subdivisions: 5,
        showLabels: true,
      })
    }
    const pos = mafsGraphPosRef.current
    if (pos !== null) {
      editor.chain().focus().updateMafsGraph({ config, pos }).run()
    } else {
      editor.chain().focus().insertMafsGraph({ config }).run()
    }
    setMafsGraphDialogOpen(false)
    mafsGraphPosRef.current = null
  }, [editor, mafsGraphConfig])

  const applyMath = useCallback(() => {
    if (!editor) return
    const pos = mathPosRef.current
    if (pos !== null) {
      if (mathMode === "inline") {
        editor.chain().setNodeSelection(pos).updateInlineMath({ latex: mathLatex }).focus().run()
      } else {
        editor.chain().setNodeSelection(pos).updateBlockMath({ latex: mathLatex }).focus().run()
      }
    } else {
      if (mathMode === "inline") {
        editor.chain().focus().insertInlineMath({ latex: mathLatex }).run()
      } else {
        editor.chain().focus().insertBlockMath({ latex: mathLatex }).run()
      }
    }
    setMathDialogOpen(false)
    setMathLatex("")
    mathPosRef.current = null
  }, [editor, mathLatex, mathMode])

  const openLinkDialog = useCallback(() => {
    const attrs = editor?.getAttributes("link")
    setLinkUrl(attrs?.href ?? "")
    setLinkText(
      editor && !editor.state.selection.empty
        ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
        : ""
    )
    setLinkDialogOpen(true)
  }, [editor])

  const applyLink = useCallback(() => {
    if (!editor) return
    const href = linkUrl.trim()
    if (href) {
      const url = href.startsWith("http") ? href : `https://${href}`
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setLinkDialogOpen(false)
    setLinkUrl("")
    setLinkText("")
  }, [editor, linkUrl])

  const insertOJTemplate = useCallback(
    (templateId: (typeof OJ_TEMPLATES)[number]["id"]) => {
      if (!editor) return
      const pos = templateSelectionRef.current
      const html =
        templateId === "sample"
          ? '<h3>Sample Input</h3><pre><code></code></pre><h3>Sample Output</h3><pre><code></code></pre>'
          : `<h3>${templateId === "input" ? "Input" : templateId === "output" ? "Output" : "Constraints"}</h3><p></p>`
      if (pos !== null) {
        editor.chain().focus().insertContentAt(pos, html).run()
        templateSelectionRef.current = null
      } else {
        editor.chain().focus().insertContent(html).run()
      }
    },
    [editor]
  )

  const insertMathSymbol = useCallback(
    (latex: string) => {
      if (!editor) return
      const pos = mathSymbolsSelectionRef.current
      editor.chain().focus().insertInlineMath({ latex, pos: pos ?? undefined }).run()
      mathSymbolsSelectionRef.current = null
      setMathSymbolsOpen(false)
    },
    [editor]
  )

  useEffect(() => {
    if (!editorFullscreen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditorFullscreen(false)
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [editorFullscreen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        const active = document.activeElement as HTMLElement | null
        const inStatementEditor = active?.closest?.("[data-statement-editor]")
        if (!inStatementEditor) return
        e.preventDefault()
        setToolbarSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (!editor) return null

  const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-0.5 border-r border-border/60 pr-2 last:border-r-0 last:pr-0">
      {children}
    </div>
  )

  const ToolbarButton = ({
    onClick,
    active,
    children,
    label,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    label: string
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-md", active && "bg-muted text-foreground")}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )

  return (
    <div
      data-statement-editor
      className={cn(
        "flex flex-col bg-muted/30",
        editorFullscreen
          ? "fixed inset-0 z-50 h-screen bg-background"
          : "flex-1 min-h-0"
      )}
    >
      {/* Toolbar - grouped by: Format | Structure | Insert | Math | View */}
      <div className="shrink-0 z-10 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border/60 bg-background/95 backdrop-blur px-4 py-2.5">
        {/* Format: text styling */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={active?.bold}
            label="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={active?.italic}
            label="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={active?.underline}
            label="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={active?.strike}
            label="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={active?.highlight}
            label="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={active?.code}
            label="Inline code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Style: color, font */}
        <ToolbarGroup>
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-md",
                      editor.getAttributes("textStyle").color && "bg-muted text-foreground"
                    )}
                    onMouseDown={() => {
                      const { from, to } = editor.state.selection
                      if (from !== to) colorSelectionRef.current = { from, to }
                      else colorSelectionRef.current = null
                    }}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Text color
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              align="start"
              className="w-56 p-3"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <p className="text-xs font-medium text-muted-foreground mb-2">Text color</p>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {[
                  "#000000",
                  "#374151",
                  "#dc2626",
                  "#ea580c",
                  "#ca8a04",
                  "#16a34a",
                  "#2563eb",
                  "#7c3aed",
                  "#db2777",
                  "#64748b",
                  "#0d9488",
                  "#0369a1",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-6 w-6 rounded-md border-2 transition-all hover:scale-110",
                      editor.getAttributes("textStyle").color === color
                        ? "border-foreground ring-1 ring-offset-2 ring-offset-background"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const sel = colorSelectionRef.current
                      if (sel) {
                        editor.chain().focus().setTextSelection(sel).setColor(color).run()
                        colorSelectionRef.current = null
                      } else {
                        editor.chain().focus().setColor(color).run()
                      }
                    }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-12 cursor-pointer rounded border border-input bg-muted p-0"
                  value={editor.getAttributes("textStyle").color || "#000000"}
                  onMouseDown={(e) => e.preventDefault()}
                  onChange={(e) => {
                    const sel = colorSelectionRef.current
                    const color = e.target.value
                    if (sel) {
                      editor.chain().focus().setTextSelection(sel).setColor(color).run()
                      colorSelectionRef.current = null
                    } else {
                      editor.chain().focus().setColor(color).run()
                    }
                  }}
                />
                <Input
                  type="text"
                  placeholder="#000000"
                  className="h-8 flex-1 font-mono text-xs"
                  value={editor.getAttributes("textStyle").color || ""}
                  onMouseDown={(e) => e.preventDefault()}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    if (v) {
                      const color = v.startsWith("#") ? v : `#${v}`
                      const sel = colorSelectionRef.current
                      if (sel) {
                        editor.chain().focus().setTextSelection(sel).setColor(color).run()
                        colorSelectionRef.current = null
                      } else {
                        editor.chain().focus().setColor(color).run()
                      }
                    }
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 h-7 text-xs"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const sel = colorSelectionRef.current
                  if (sel) {
                    editor.chain().focus().setTextSelection(sel).unsetColor().run()
                    colorSelectionRef.current = null
                  } else {
                    editor.chain().focus().unsetColor().run()
                  }
                }}
              >
                Reset to default
              </Button>
            </PopoverContent>
          </Popover>

          {/* Font family */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-md",
                      editor.getAttributes("textStyle").fontFamily && "bg-muted text-foreground"
                    )}
                    onMouseDown={() => {
                      const { from, to } = editor.state.selection
                      if (from !== to) fontSelectionRef.current = { from, to }
                      else fontSelectionRef.current = null
                    }}
                  >
                    <CaseSensitive className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Font
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
              {FONT_OPTIONS.map(({ label, value }) => (
                <DropdownMenuItem
                  key={label || "default"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const sel = fontSelectionRef.current
                    if (value) {
                      if (sel) {
                        editor.chain().focus().setTextSelection(sel).setFontFamily(value).run()
                        fontSelectionRef.current = null
                      } else {
                        editor.chain().focus().setFontFamily(value).run()
                      }
                    } else {
                      if (sel) {
                        editor.chain().focus().setTextSelection(sel).unsetFontFamily().run()
                        fontSelectionRef.current = null
                      } else {
                        editor.chain().focus().unsetFontFamily().run()
                      }
                    }
                  }}
                  className={cn(
                    (value ? editor.getAttributes("textStyle").fontFamily === value : !editor.getAttributes("textStyle").fontFamily) && "bg-accent"
                  )}
                  style={value ? { fontFamily: value } : undefined}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            active={active?.subscript}
            label="Subscript (x_i)"
          >
            <SubscriptIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            active={active?.superscript}
            label="Superscript (x²)"
          >
            <SuperscriptIcon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Structure: headings, lists */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={active?.heading1}
            label="Heading 1"
          >
            <span className="text-sm font-bold">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={active?.heading2}
            label="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={active?.heading3}
            label="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            label="Paragraph"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={active?.bulletList}
            label="Bullet list"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={active?.orderedList}
            label="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={active?.taskList}
            label="Task list"
          >
            <ListTodo className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Insert: blockquote, code, link, table, media */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={active?.blockquote}
            label="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setCodeBlock().run()}
            active={active?.codeBlock}
            label="Code block"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            label="Horizontal rule"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-md", active?.link && "bg-muted text-foreground")}
                onClick={openLinkDialog}
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Insert link
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={openInsertMermaid}
              >
                <Workflow className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Insert diagram (Mermaid)
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={openInsertMafsGraph}
              >
                <LineChart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Insert graph
            </TooltipContent>
          </Tooltip>
          {active?.link && (
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              label="Remove link"
            >
              <Unlink className="h-4 w-4" />
            </ToolbarButton>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-md", active?.table && "bg-muted text-foreground")}
              >
                <Table2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run()}>
                Insert table (2×3)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 4, withHeaderRow: true }).run()}>
                Insert table (3×4)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 5, withHeaderRow: true }).run()}>
                Insert table (4×5)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()}>
                Simple table (2×2)
              </DropdownMenuItem>
              {active?.table && (
                <>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                    Add column
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                    Add row
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="text-destructive">
                    Delete table
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolbarGroup>

        {/* Math: inline, block, symbols */}
        <ToolbarGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-md px-2 text-xs"
                  onClick={() => openInsertMath("inline")}
                >
                  <Sigma className="h-4 w-4" />
                  Inline
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-md px-2 text-xs"
                  onClick={() => openInsertMath("block")}
                >
                  <Square className="h-4 w-4" />
                  Block
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Insert math (LaTeX)
            </TooltipContent>
          </Tooltip>
          <Popover open={mathSymbolsOpen} onOpenChange={(open) => {
            setMathSymbolsOpen(open)
            if (open) mathSymbolsSelectionRef.current = editor.state.selection.from
          }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 rounded-md px-2 text-xs"
                    onMouseDown={() => {
                      mathSymbolsSelectionRef.current = editor.state.selection.from
                    }}
                  >
                    <Braces className="h-4 w-4" />
                    Symbols
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Insert math symbol (searchable)
              </TooltipContent>
            </Tooltip>
            <PopoverContent align="start" className="w-[340px] max-h-[min(400px,85vh)] flex flex-col p-0 overflow-hidden" onCloseAutoFocus={(e) => e.preventDefault()}>
              <Command
                className="flex-1 min-h-0"
                filter={(value, search) => {
                  if (!search?.trim()) return 1
                  const s = search.toLowerCase().trim()
                  const v = value.toLowerCase()
                  return v.includes(s) ? 1 : 0
                }}
              >
                <CommandInput placeholder="Search math symbols…" />
                <CommandList className="flex-1 min-h-0 overflow-y-auto">
                  <CommandEmpty>No symbols found.</CommandEmpty>
                  <CommandGroup heading="Math symbols & expressions">
                    {MATH_SYMBOLS.map((sym, i) => (
                      <CommandItem
                        key={i}
                        value={`${sym.label} ${sym.keywords} ${sym.latex}`}
                        onSelect={() => insertMathSymbol(sym.latex)}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{sym.label}</span>
                        <code className="shrink-0 text-[10px] text-muted-foreground font-mono max-w-[140px] truncate">
                          {sym.latex}
                        </code>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </ToolbarGroup>

        {/* Templates: input, output, constraints, sample */}
        <ToolbarGroup>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-md px-2 text-xs"
                    onMouseDown={() => {
                      templateSelectionRef.current = editor.state.selection.from
                    }}
                  >
                    <LayoutTemplate className="h-4 w-4" />
                    Templates
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Insert problem statement templates
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-52" onCloseAutoFocus={(e) => e.preventDefault()}>
              {OJ_TEMPLATES.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertOJTemplate(t.id)}
                >
                  <span className="mr-2 text-muted-foreground">{t.icon}</span>
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolbarGroup>

        {/* View: preview, fullscreen */}
        <ToolbarGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-md px-2 text-xs"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[240px]">
              Preview how the statement will look when published. Tip: Use $...$ for inline math, $$...$$ for block math. Click any formula or diagram to edit.
            </TooltipContent>
          </Tooltip>
        </ToolbarGroup>

        {/* Fullscreen */}
        <ToolbarGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-md px-2 text-xs"
                onClick={() => setEditorFullscreen((v) => !v)}
              >
                {editorFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                {editorFullscreen ? "Exit" : "Fullscreen"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {editorFullscreen ? "Exit fullscreen (Esc)" : "Expand editor to fullscreen"}
            </TooltipContent>
          </Tooltip>
        </ToolbarGroup>

        {/* Search (⌘K) - rightmost */}
        <div className="ml-auto">
          <ToolbarGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setToolbarSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Search toolbar actions (⌘K / Ctrl+K)
              </TooltipContent>
            </Tooltip>
          </ToolbarGroup>
        </div>
      </div>

      {/* Document area - fills all available space */}
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border/60 bg-background shadow-sm">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Math dialog */}
      <Dialog open={mathDialogOpen} onOpenChange={setMathDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle>
              {mathPosRef.current !== null ? "Edit" : "Insert"} {mathMode === "inline" ? "inline" : "block"} math
            </DialogTitle>
            <DialogDescription>
              Enter LaTeX. Example: <code className="text-xs">{"\\frac{a}{b}"}</code> or{" "}
              <code className="text-xs">{"\\sum_{i=1}^n i"}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="math-latex">LaTeX</Label>
                <Input
                  id="math-latex"
                  value={mathLatex}
                  onChange={(e) => setMathLatex(e.target.value)}
                  placeholder={"e.g. \\frac{a}{b}"}
                  className="font-mono"
                  onKeyDown={(e) => e.key === "Enter" && applyMath()}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={() => setMathDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyMath}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mafs graph dialog */}
      <Dialog open={mafsGraphDialogOpen} onOpenChange={setMafsGraphDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle>
              {mafsGraphPosRef.current !== null ? "Edit" : "Insert"} graph
            </DialogTitle>
            <DialogDescription>
              Define function plots y = f(x). Use <code className="rounded bg-muted px-1">x</code> as
              the variable. Supports sin, cos, tan, sqrt, log, exp, abs, etc.{" "}
              <a
                href="https://mafs.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Mafs docs
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mafs-graph-config">Expressions (JSON)</Label>
                <Textarea
                  id="mafs-graph-config"
                  value={mafsGraphConfig}
                  onChange={(e) => setMafsGraphConfig(e.target.value)}
                  placeholder='{"expressions": ["x^2", "sin(x)"], "xMin": -5, "xMax": 5, "yMin": -5, "yMax": 5}'
                  className="font-mono text-sm min-h-[100px]"
                  onKeyDown={(e) =>
                    (e.metaKey || e.ctrlKey) && e.key === "Enter" && applyMafsGraph()
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Example: <code className="rounded bg-muted px-1">x^2</code>,{" "}
                  <code className="rounded bg-muted px-1">sin(x)</code>,{" "}
                  <code className="rounded bg-muted px-1">2*x + 1</code>
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Viewport (visible area)</Label>
                <div className="grid grid-cols-4 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="mafs-xmin" className="text-xs font-normal text-muted-foreground">
                      x min
                    </Label>
                    <Input
                      id="mafs-xmin"
                      type="number"
                      step="any"
                      value={(() => {
                        try {
                          return JSON.parse(mafsGraphConfig).xMin ?? -5
                        } catch {
                          return -5
                        }
                      })()}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!Number.isNaN(v)) {
                          try {
                            const cfg = JSON.parse(mafsGraphConfig)
                            setMafsGraphConfig(JSON.stringify({ ...cfg, xMin: v }, null, 2))
                          } catch {
                            setMafsGraphConfig(
                              JSON.stringify(
                                { expressions: ["x^2"], xMin: v, xMax: 5, yMin: -5, yMax: 5 },
                                null,
                                2
                              )
                            )
                          }
                        }
                      }}
                      className="font-mono"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="mafs-xmax" className="text-xs font-normal text-muted-foreground">
                      x max
                    </Label>
                    <Input
                      id="mafs-xmax"
                      type="number"
                      step="any"
                      value={(() => {
                        try {
                          return JSON.parse(mafsGraphConfig).xMax ?? 5
                        } catch {
                          return 5
                        }
                      })()}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!Number.isNaN(v)) {
                          try {
                            const cfg = JSON.parse(mafsGraphConfig)
                            setMafsGraphConfig(JSON.stringify({ ...cfg, xMax: v }, null, 2))
                          } catch {
                            setMafsGraphConfig(
                              JSON.stringify(
                                { expressions: ["x^2"], xMin: -5, xMax: v, yMin: -5, yMax: 5 },
                                null,
                                2
                              )
                            )
                          }
                        }
                      }}
                      className="font-mono"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="mafs-ymin" className="text-xs font-normal text-muted-foreground">
                      y min
                    </Label>
                    <Input
                      id="mafs-ymin"
                      type="number"
                      step="any"
                      value={(() => {
                        try {
                          return JSON.parse(mafsGraphConfig).yMin ?? -5
                        } catch {
                          return -5
                        }
                      })()}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!Number.isNaN(v)) {
                          try {
                            const cfg = JSON.parse(mafsGraphConfig)
                            setMafsGraphConfig(JSON.stringify({ ...cfg, yMin: v }, null, 2))
                          } catch {
                            setMafsGraphConfig(
                              JSON.stringify(
                                { expressions: ["x^2"], xMin: -5, xMax: 5, yMin: v, yMax: 5 },
                                null,
                                2
                              )
                            )
                          }
                        }
                      }}
                      className="font-mono"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="mafs-ymax" className="text-xs font-normal text-muted-foreground">
                      y max
                    </Label>
                    <Input
                      id="mafs-ymax"
                      type="number"
                      step="any"
                      value={(() => {
                        try {
                          return JSON.parse(mafsGraphConfig).yMax ?? 5
                        } catch {
                          return 5
                        }
                      })()}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!Number.isNaN(v)) {
                          try {
                            const cfg = JSON.parse(mafsGraphConfig)
                            setMafsGraphConfig(JSON.stringify({ ...cfg, yMax: v }, null, 2))
                          } catch {
                            setMafsGraphConfig(
                              JSON.stringify(
                                { expressions: ["x^2"], xMin: -5, xMax: 5, yMin: -5, yMax: v },
                                null,
                                2
                              )
                            )
                          }
                        }
                      }}
                      className="font-mono"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Set the visible coordinate range. The graph will zoom to this area.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Scaling (Desmos-style)</Label>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="mafs-equal-scale"
                      checked={(() => {
                        try {
                          const cfg = JSON.parse(mafsGraphConfig)
                          return cfg.equalScale !== false
                        } catch {
                          return true
                        }
                      })()}
                      onCheckedChange={(checked) => {
                        try {
                          const cfg = JSON.parse(mafsGraphConfig)
                          setMafsGraphConfig(JSON.stringify({ ...cfg, equalScale: checked }, null, 2))
                        } catch {
                          setMafsGraphConfig(
                            JSON.stringify(
                              {
                                expressions: ["x^2"],
                                xMin: -5,
                                xMax: 5,
                                yMin: -5,
                                yMax: 5,
                                equalScale: checked,
                                subdivisions: 5,
                                showLabels: true,
                              },
                              null,
                              2
                            )
                          )
                        }
                      }}
                    />
                    <Label htmlFor="mafs-equal-scale" className="text-sm font-normal cursor-pointer">
                      Equal scale (1 unit x = 1 unit y)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="mafs-show-labels"
                      checked={(() => {
                        try {
                          const cfg = JSON.parse(mafsGraphConfig)
                          return cfg.showLabels !== false
                        } catch {
                          return true
                        }
                      })()}
                      onCheckedChange={(checked) => {
                        try {
                          const cfg = JSON.parse(mafsGraphConfig)
                          setMafsGraphConfig(JSON.stringify({ ...cfg, showLabels: checked }, null, 2))
                        } catch {
                          setMafsGraphConfig(
                            JSON.stringify(
                              {
                                expressions: ["x^2"],
                                xMin: -5,
                                xMax: 5,
                                yMin: -5,
                                yMax: 5,
                                equalScale: true,
                                subdivisions: 5,
                                showLabels: checked,
                              },
                              null,
                              2
                            )
                          )
                        }
                      }}
                    />
                    <Label htmlFor="mafs-show-labels" className="text-sm font-normal cursor-pointer">
                      Axis labels
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="mafs-subdivisions" className="text-sm font-normal text-muted-foreground">
                      Grid density
                    </Label>
                    <Select
                      value={(() => {
                        try {
                          return String(JSON.parse(mafsGraphConfig).subdivisions ?? 5)
                        } catch {
                          return "5"
                        }
                      })()}
                      onValueChange={(v) => {
                        const n = parseInt(v, 10)
                        if (!Number.isNaN(n)) {
                          try {
                            const cfg = JSON.parse(mafsGraphConfig)
                            setMafsGraphConfig(JSON.stringify({ ...cfg, subdivisions: n }, null, 2))
                          } catch {
                            setMafsGraphConfig(
                              JSON.stringify(
                                {
                                  expressions: ["x^2"],
                                  xMin: -5,
                                  xMax: 5,
                                  yMin: -5,
                                  yMax: 5,
                                  equalScale: true,
                                  subdivisions: n,
                                  showLabels: true,
                                },
                                null,
                                2
                              )
                            )
                          }
                        }
                      }}
                    >
                      <SelectTrigger id="mafs-subdivisions" className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Equal scale keeps circles round (Desmos default). Grid density controls how many lines appear.
                </p>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <p className="text-xs font-medium text-muted-foreground px-3 py-2 bg-muted/30 border-b border-border">
                  Preview
                </p>
                <div className="p-3 bg-background">
                  <MafsGraphRenderer config={mafsGraphConfig} height={200} interactive />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={() => setMafsGraphDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyMafsGraph}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mermaid diagram dialog */}
      <Dialog open={mermaidDialogOpen} onOpenChange={setMermaidDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle>
              {mermaidPosRef.current !== null ? "Edit" : "Insert"} diagram
            </DialogTitle>
            <DialogDescription>
              Enter Mermaid diagram code. Supports flowcharts, sequence diagrams, and more.{" "}
              <a
                href="https://mermaid.js.org/intro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Mermaid docs
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mermaid-diagram">Mermaid code</Label>
                <Textarea
                  id="mermaid-diagram"
                  value={mermaidDiagram}
                  onChange={(e) => setMermaidDiagram(e.target.value)}
                  placeholder="graph TD&#10;  A --> B"
                  className="font-mono text-sm min-h-[200px]"
                  onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && applyMermaid()}
                />
                <p className="text-xs text-muted-foreground">
                  Example: <code className="rounded bg-muted px-1">graph TD</code>,{" "}
                  <code className="rounded bg-muted px-1">flowchart LR</code>,{" "}
                  <code className="rounded bg-muted px-1">sequenceDiagram</code>
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={() => setMermaidDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyMermaid}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle>Insert link</DialogTitle>
            <DialogDescription>
              Enter the URL. Selected text will become the link, or the URL will be used as display text.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="font-mono"
                  onKeyDown={(e) => e.key === "Enter" && applyLink()}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyLink}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toolbar search (⌘K) */}
      <Dialog open={toolbarSearchOpen} onOpenChange={setToolbarSearchOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Search toolbar actions</DialogTitle>
          <Command
            className="rounded-lg border-0"
            filter={(value, search) => {
              if (!search?.trim()) return 1
              const s = search.toLowerCase().trim()
              const v = value.toLowerCase()
              return v.includes(s) ? 1 : 0
            }}
          >
            <CommandInput placeholder="Search toolbar actions… (⌘K)" className="h-12" />
            <CommandList className="max-h-[min(400px,70vh)]">
              <CommandEmpty>No actions found.</CommandEmpty>
              <CommandGroup heading="Format">
                <CommandItem value="bold" onSelect={() => { editor.chain().focus().toggleBold().run(); setToolbarSearchOpen(false) }}><Bold className="h-4 w-4" />Bold</CommandItem>
                <CommandItem value="italic" onSelect={() => { editor.chain().focus().toggleItalic().run(); setToolbarSearchOpen(false) }}><Italic className="h-4 w-4" />Italic</CommandItem>
                <CommandItem value="underline" onSelect={() => { editor.chain().focus().toggleUnderline().run(); setToolbarSearchOpen(false) }}><UnderlineIcon className="h-4 w-4" />Underline</CommandItem>
                <CommandItem value="strikethrough" onSelect={() => { editor.chain().focus().toggleStrike().run(); setToolbarSearchOpen(false) }}><Strikethrough className="h-4 w-4" />Strikethrough</CommandItem>
                <CommandItem value="highlight" onSelect={() => { editor.chain().focus().toggleHighlight().run(); setToolbarSearchOpen(false) }}><Highlighter className="h-4 w-4" />Highlight</CommandItem>
                <CommandItem value="inline code" onSelect={() => { editor.chain().focus().toggleCode().run(); setToolbarSearchOpen(false) }}><Code className="h-4 w-4" />Inline code</CommandItem>
                <CommandItem value="subscript superscript" onSelect={() => { editor.chain().focus().toggleSubscript().run(); setToolbarSearchOpen(false) }}><SubscriptIcon className="h-4 w-4" />Subscript</CommandItem>
                <CommandItem value="superscript" onSelect={() => { editor.chain().focus().toggleSuperscript().run(); setToolbarSearchOpen(false) }}><SuperscriptIcon className="h-4 w-4" />Superscript</CommandItem>
              </CommandGroup>
              <CommandGroup heading="Structure">
                <CommandItem value="heading 1 h1" onSelect={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setToolbarSearchOpen(false) }}><Heading1 className="h-4 w-4" />Heading 1</CommandItem>
                <CommandItem value="heading 2 h2" onSelect={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setToolbarSearchOpen(false) }}><Heading2 className="h-4 w-4" />Heading 2</CommandItem>
                <CommandItem value="heading 3 h3" onSelect={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setToolbarSearchOpen(false) }}><Heading3 className="h-4 w-4" />Heading 3</CommandItem>
                <CommandItem value="paragraph" onSelect={() => { editor.chain().focus().setParagraph().run(); setToolbarSearchOpen(false) }}><Type className="h-4 w-4" />Paragraph</CommandItem>
                <CommandItem value="bullet list" onSelect={() => { editor.chain().focus().toggleBulletList().run(); setToolbarSearchOpen(false) }}><List className="h-4 w-4" />Bullet list</CommandItem>
                <CommandItem value="numbered ordered list" onSelect={() => { editor.chain().focus().toggleOrderedList().run(); setToolbarSearchOpen(false) }}><ListOrdered className="h-4 w-4" />Numbered list</CommandItem>
                <CommandItem value="task todo list" onSelect={() => { editor.chain().focus().toggleTaskList().run(); setToolbarSearchOpen(false) }}><ListTodo className="h-4 w-4" />Task list</CommandItem>
              </CommandGroup>
              <CommandGroup heading="Insert">
                <CommandItem value="blockquote quote" onSelect={() => { editor.chain().focus().toggleBlockquote().run(); setToolbarSearchOpen(false) }}><Quote className="h-4 w-4" />Blockquote</CommandItem>
                <CommandItem value="code block" onSelect={() => { editor.chain().focus().setCodeBlock().run(); setToolbarSearchOpen(false) }}><Code className="h-4 w-4" />Code block</CommandItem>
                <CommandItem value="horizontal rule divider" onSelect={() => { editor.chain().focus().setHorizontalRule().run(); setToolbarSearchOpen(false) }}><Minus className="h-4 w-4" />Horizontal rule</CommandItem>
                <CommandItem value="link" onSelect={() => { openLinkDialog(); setToolbarSearchOpen(false) }}><Link2 className="h-4 w-4" />Insert link</CommandItem>
                <CommandItem value="table" onSelect={() => { editor.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run(); setToolbarSearchOpen(false) }}><Table2 className="h-4 w-4" />Insert table</CommandItem>
                <CommandItem value="mermaid diagram flowchart" onSelect={() => { openInsertMermaid(); setToolbarSearchOpen(false) }}><Workflow className="h-4 w-4" />Insert diagram (Mermaid)</CommandItem>
                <CommandItem value="graph plot chart" onSelect={() => { openInsertMafsGraph(); setToolbarSearchOpen(false) }}><LineChart className="h-4 w-4" />Insert graph</CommandItem>
              </CommandGroup>
              <CommandGroup heading="Math">
                <CommandItem value="inline math latex" onSelect={() => { openInsertMath("inline"); setToolbarSearchOpen(false) }}><Sigma className="h-4 w-4" />Insert inline math</CommandItem>
                <CommandItem value="block math latex" onSelect={() => { openInsertMath("block"); setToolbarSearchOpen(false) }}><Square className="h-4 w-4" />Insert block math</CommandItem>
                <CommandItem value="math symbols" onSelect={() => { setMathSymbolsOpen(true); mathSymbolsSelectionRef.current = editor.state.selection.from; setToolbarSearchOpen(false) }}><Braces className="h-4 w-4" />Math symbols</CommandItem>
              </CommandGroup>
              <CommandGroup heading="Templates">
                <CommandItem value="input format template" onSelect={() => { insertOJTemplate("input"); setToolbarSearchOpen(false) }}><LayoutTemplate className="h-4 w-4" />Input format</CommandItem>
                <CommandItem value="output format template" onSelect={() => { insertOJTemplate("output"); setToolbarSearchOpen(false) }}><LayoutTemplate className="h-4 w-4" />Output format</CommandItem>
                <CommandItem value="constraints template" onSelect={() => { insertOJTemplate("constraints"); setToolbarSearchOpen(false) }}><LayoutTemplate className="h-4 w-4" />Constraints</CommandItem>
                <CommandItem value="sample io template" onSelect={() => { insertOJTemplate("sample"); setToolbarSearchOpen(false) }}><LayoutTemplate className="h-4 w-4" />Sample I/O</CommandItem>
              </CommandGroup>
              <CommandGroup heading="View">
                <CommandItem value="preview" onSelect={() => { setPreviewOpen(true); setToolbarSearchOpen(false) }}><Eye className="h-4 w-4" />Preview</CommandItem>
                <CommandItem value="fullscreen" onSelect={() => { setEditorFullscreen((v) => !v); setToolbarSearchOpen(false) }}><Maximize2 className="h-4 w-4" />Toggle fullscreen</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border bg-muted/30 px-6 py-5">
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>
              How your statement will appear to users when published
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <div className="rounded-lg border border-border/60 bg-background shadow-sm overflow-hidden">
              {previewOpen && (
                <StatementPreview
                  content={
                    editor
                      ? JSON.stringify(editor.getJSON())
                      : value
                  }
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface StatementStepProps {
  mode: "create" | "edit"
}

export function StatementStep({ mode }: StatementStepProps) {
  const form = useFormContext<MetadataFormValues>()
  const statement = form.watch("statement") ?? ""

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <TooltipProvider delayDuration={300}>
        <StatementEditor
          value={statement}
          onChange={(v) => form.setValue("statement", v, { shouldDirty: true })}
        />
      </TooltipProvider>
    </div>
  )
}
