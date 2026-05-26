"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import mermaid from "mermaid"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mermaidDiagram: {
      insertMermaidDiagram: (options?: { diagram?: string; pos?: number }) => ReturnType
      updateMermaidDiagram: (options: { diagram: string; pos?: number }) => ReturnType
    }
  }
}

let mermaidInitialized = false
function ensureMermaidInit() {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "neutral",
  })
  mermaidInitialized = true
}

let idCounter = 0
function nextId() {
  return `mermaid-${Date.now()}-${++idCounter}`
}

export interface MermaidOptions {
  onClick?: (node: { attrs: { diagram: string } }, pos: number) => void
}

export const MermaidDiagram = Node.create<MermaidOptions>({
  name: "mermaidDiagram",

  group: "block",
  atom: true,

  addOptions() {
    return {
      onClick: undefined,
    }
  },

  addAttributes() {
    return {
      diagram: {
        default: "graph TD\n  A --> B",
        parseHTML: (el) => el.getAttribute("data-diagram") ?? "",
        renderHTML: (attrs) => ({ "data-diagram": attrs.diagram }),
      },
    }
  },

  addCommands() {
    return {
      insertMermaidDiagram:
        (options?: { diagram?: string; pos?: number }) =>
        ({ commands, editor }) => {
          const diagram = options?.diagram ?? "graph TD\n  A --> B"
          const pos = options?.pos ?? editor.state.selection.from
          return commands.insertContentAt(pos, {
            type: this.name,
            attrs: { diagram },
          })
        },
      updateMermaidDiagram:
        (options: { diagram: string; pos?: number }) =>
        ({ editor, tr }) => {
          let pos = options.pos
          if (pos === undefined) pos = editor.state.selection.$from.pos
          const node = editor.state.doc.nodeAt(pos)
          if (!node || node.type.name !== this.name) return false
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, diagram: options.diagram })
          return true
        },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid-diagram"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "mermaid-diagram" })]
  },

  addNodeView() {
    const extension = this
    return ({ node: initialNode, getPos, editor }) => {
      let currentNode = initialNode
      const wrapper = document.createElement("div")
      wrapper.className = "mermaid-diagram-wrapper"
      wrapper.dataset.type = "mermaid-diagram"
      wrapper.setAttribute("data-diagram", currentNode.attrs.diagram)

      const container = document.createElement("div")
      container.className = "mermaid-diagram-container"
      wrapper.appendChild(container)

      const renderDiagram = async () => {
        const diagram = currentNode.attrs.diagram?.trim()
        if (!diagram) {
          container.innerHTML = '<p class="text-muted-foreground text-sm p-4">Empty diagram</p>'
          wrapper.classList.remove("mermaid-diagram-error")
          return
        }

        ensureMermaidInit()
        const id = nextId()

        try {
          const { svg, bindFunctions } = await mermaid.render(id, diagram)
          container.innerHTML = svg
          bindFunctions?.(container)
          wrapper.classList.remove("mermaid-diagram-error")
        } catch (err) {
          wrapper.classList.add("mermaid-diagram-error")
          const msg = err instanceof Error ? err.message : String(err)
          container.innerHTML = `
            <pre class="text-destructive text-xs p-4 overflow-auto max-h-48 m-0">${escapeHtml(msg)}</pre>
            <pre class="text-muted-foreground text-xs p-4 overflow-auto max-h-32 m-0 border-t border-border">${escapeHtml(diagram)}</pre>
          `
        }
      }

      const handleClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        const pos = getPos()
        if (typeof pos === "number" && extension.options.onClick) {
          extension.options.onClick(currentNode as unknown as { attrs: { diagram: string } }, pos)
        }
      }

      wrapper.addEventListener("click", handleClick)
      if (editor.isEditable) {
        wrapper.style.cursor = "pointer"
      }

      renderDiagram()

      return {
        dom: wrapper,
        update(updatedNode) {
          if (updatedNode.type !== extension.type) return false
          if (updatedNode.attrs.diagram !== currentNode.attrs.diagram) {
            currentNode = updatedNode
            wrapper.setAttribute("data-diagram", currentNode.attrs.diagram)
            renderDiagram()
          }
          return true
        },
        destroy() {
          wrapper.removeEventListener("click", handleClick)
        },
      }
    }
  },
})

function escapeHtml(s: string): string {
  const div = document.createElement("div")
  div.textContent = s
  return div.innerHTML
}
