"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { createRoot, type Root } from "react-dom/client"
import React from "react"
import { MafsGraphRenderer, type MafsGraphConfig } from "./mafs-graph-renderer"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mafsGraph: {
      insertMafsGraph: (options?: { config?: string; pos?: number }) => ReturnType
      updateMafsGraph: (options: { config: string; pos?: number }) => ReturnType
    }
  }
}

const DEFAULT_CONFIG: MafsGraphConfig = {
  expressions: ["x^2"],
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  equalScale: true,
  subdivisions: 5,
  showLabels: true,
}

export interface MafsGraphOptions {
  onClick?: (node: { attrs: { config: string } }, pos: number) => void
}

export const MafsGraph = Node.create<MafsGraphOptions>({
  name: "mafsGraph",

  group: "block",
  atom: true,
  draggable: false,

  addOptions() {
    return {
      onClick: undefined,
    }
  },

  addAttributes() {
    return {
      config: {
        default: JSON.stringify(DEFAULT_CONFIG),
        parseHTML: (el) => el.getAttribute("data-config") ?? JSON.stringify(DEFAULT_CONFIG),
        renderHTML: (attrs) => ({ "data-config": attrs.config }),
      },
    }
  },

  addCommands() {
    return {
      insertMafsGraph:
        (options?: { config?: string; pos?: number }) =>
        ({ commands, editor }) => {
          const config = options?.config ?? JSON.stringify(DEFAULT_CONFIG)
          const pos = options?.pos ?? editor.state.selection.from
          return commands.insertContentAt(pos, {
            type: this.name,
            attrs: { config },
          })
        },
      updateMafsGraph:
        (options: { config: string; pos?: number }) =>
        ({ editor, tr }) => {
          let pos = options.pos
          if (pos === undefined) pos = editor.state.selection.$from.pos
          const node = editor.state.doc.nodeAt(pos)
          if (!node || node.type.name !== this.name) return false
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, config: options.config })
          return true
        },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mafs-graph"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "mafs-graph" })]
  },

  addNodeView() {
    const extension = this
    return ({ node: initialNode, getPos, editor }) => {
      let currentNode = initialNode
      const wrapper = document.createElement("div")
      wrapper.className = "mafs-graph-wrapper my-4"
      wrapper.dataset.type = "mafs-graph"
      wrapper.setAttribute("data-config", currentNode.attrs.config ?? "")
      wrapper.setAttribute("contenteditable", "false")
      wrapper.draggable = false

      const container = document.createElement("div")
      container.className = "mafs-graph-container"
      wrapper.appendChild(container)

      let root: Root | null = null

      const renderGraph = () => {
        const config = currentNode.attrs.config ?? JSON.stringify(DEFAULT_CONFIG)
        if (!root) {
          root = createRoot(container)
        }
        root.render(
          React.createElement(MafsGraphRenderer, {
            config,
            height: 280,
            interactive: true,
          })
        )
      }

      const handleClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        const pos = getPos()
        if (typeof pos === "number" && extension.options.onClick) {
          extension.options.onClick(
            currentNode as unknown as { attrs: { config: string } },
            pos
          )
        }
      }

      wrapper.addEventListener("click", handleClick)
      if (editor.isEditable) {
        wrapper.style.cursor = "pointer"
      }

      renderGraph()

      const stopEvent = (event: Event) => {
        const target = event.target
        if (!target || !(target instanceof globalThis.Node)) return false
        if (!wrapper.contains(target)) return false
        const t = event.type
        if (
          t === "mousedown" ||
          t === "mousemove" ||
          t === "mouseup" ||
          t === "pointerdown" ||
          t === "pointermove" ||
          t === "pointerup" ||
          t === "touchstart" ||
          t === "touchmove" ||
          t === "touchend"
        ) {
          return true
        }
        return false
      }

      return {
        dom: wrapper,
        stopEvent,
        update(updatedNode) {
          if (updatedNode.type !== extension.type) return false
          if (updatedNode.attrs.config !== currentNode.attrs.config) {
            currentNode = updatedNode
            wrapper.setAttribute("data-config", currentNode.attrs.config ?? "")
            renderGraph()
          }
          return true
        },
        destroy() {
          wrapper.removeEventListener("click", handleClick)
          if (root) {
            root.unmount()
            root = null
          }
        },
      }
    }
  },
})
