"use client"

import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapLink from "@tiptap/extension-link"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { Underline } from "@tiptap/extension-underline"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { TextStyle, Color, FontFamily } from "@tiptap/extension-text-style"
import { TableKit } from "@tiptap/extension-table"
import { Mathematics } from "@tiptap/extension-mathematics"
import { MermaidDiagram } from "@/app/organizations/[slug]/dashboard/libraries/[libraryId]/problems/_form/mermaid-extension"
import { MafsGraph } from "@/app/organizations/[slug]/dashboard/libraries/[libraryId]/problems/_form/mafs-extension"
import "katex/dist/katex.min.css"

/** Color extension with !important so text color isn't overridden by Tailwind utilities */
const ColorWithPriority = Color.extend({
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    color: {
                        default: null,
                        parseHTML: (element: HTMLElement) => {
                            const styleAttr = element.getAttribute("style")
                            if (styleAttr) {
                                const decls = styleAttr
                                    .split(";")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
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
                        renderHTML: (attributes: Record<string, string | null>) => {
                            if (!attributes.color) return {}
                            return { style: `color: ${attributes.color} !important` }
                        },
                    },
                },
            },
        ]
    },
})

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

const PREVIEW_EDITOR_CLASS =
    "min-h-[200px] px-4 py-4 text-sm leading-[1.7] [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_pre]:bg-muted/80 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_code]:bg-muted/80 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3 [&_blockquote]:text-muted-foreground [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-900/50 [&_mark]:rounded [&_mark]:px-0.5 [&_table]:border-collapse [&_table]:w-full [&_table]:my-3 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2 [&_li[data-type=taskItem]>label]:flex [&_li[data-type=taskItem]>label]:shrink-0 [&_li[data-type=taskItem]>label]:cursor-default [&_li[data-type=taskItem]_input]:pointer-events-none [&_li[data-type=taskItem]>div]:min-w-0 [&_li[data-type=taskItem]>div>p:first-child]:!mt-0"

interface StatementPreviewProps {
    content: string
    className?: string
}

export function StatementPreview({ content, className }: StatementPreviewProps) {
    const parsed = parseStatement(content)
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                codeBlock: { HTMLAttributes: { class: "font-mono text-sm" } },
            }),
            TiptapLink.configure({
                openOnClick: false,
                HTMLAttributes: { class: "text-primary underline underline-offset-2" },
            }),
            TaskList,
            TaskItem.configure({ nested: true, HTMLAttributes: { class: "flex items-start gap-2" } }),
            Underline,
            Highlight.configure({ multicolor: false }),
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
            Mathematics.configure({ katexOptions: { throwOnError: false } }),
            MermaidDiagram.configure(),
            MafsGraph.configure(),
        ],
        content: parsed && typeof parsed === "object" ? parsed : undefined,
        editable: false,
        editorProps: {
            attributes: {
                class: className ? `${PREVIEW_EDITOR_CLASS} ${className}` : PREVIEW_EDITOR_CLASS,
            },
        },
        immediatelyRender: false,
    })

    useEffect(() => {
        if (!editor) return
        const next = parseStatement(content)
        if (next && typeof next === "object") {
            editor.commands.setContent(next, { emitUpdate: false })
        } else if (!next) {
            editor.commands.clearContent(false)
        }
    }, [editor, content])

    if (!editor) return null
    return <EditorContent editor={editor} />
}
