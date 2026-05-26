"use client"

import * as React from "react"
import {
  type Row,
  type Table as TableInstance,
  flexRender,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react"
import { ShiftWheelScroll } from "@/components/shift-wheel-scroll"

const DEFAULT_NON_REORDERABLE = ["select", "actions"]

export interface DataTableProps<TData> {
  table: TableInstance<TData>
  /** When provided, column drag-and-drop reordering is enabled. */
  reorderColumn?: (movingColumnId: string, targetColumnId: string) => void
  /** Column ids that cannot be dragged (e.g. select checkbox, actions). */
  nonReorderableColumnIds?: string[]
  scrollAreaId?: string
  emptyMessage?: React.ReactNode
  /** Wrap each row (e.g. ContextMenu + TableRow with onClick). Receives row and the cell elements. */
  renderRowWrapper?: (
    row: Row<TData>,
    cells: React.ReactNode
  ) => React.ReactNode
  tableClassName?: string
  /** Optional class for the outer wrapper (e.g. border-0 when parent provides scroll + border). */
  wrapperClassName?: string
  /** Keep the table header visible when scrolling the table body. */
  stickyHeader?: boolean
  /** When provided, column resize uses direct DOM updates during drag (instant) and calls this on mouseup to persist. */
  onColumnResizeEnd?: (columnId: string, width: number) => void
}

export function DataTable<TData>({
  table,
  reorderColumn,
  nonReorderableColumnIds = DEFAULT_NON_REORDERABLE,
  scrollAreaId,
  emptyMessage = "No results.",
  renderRowWrapper,
  tableClassName,
  wrapperClassName,
  stickyHeader = false,
  onColumnResizeEnd,
}: DataTableProps<TData>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [headerPressedColumnId, setHeaderPressedColumnId] = React.useState<
    string | null
  >(null)
  const [draggingColumnId, setDraggingColumnId] = React.useState<string | null>(
    null
  )
  const [dropTargetColumnId, setDropTargetColumnId] = React.useState<
    string | null
  >(null)
  const [resizingColumnId, setResizingColumnId] = React.useState<string | null>(
    null
  )

  const resizeStateRef = React.useRef<{
    columnId: string
    startX: number
    startWidth: number
    minSize: number
    maxSize: number
    lastWidth: number
  } | null>(null)

  const applyColumnWidth = React.useCallback(
    (columnId: string, width: number) => {
      const root = wrapperRef.current
      if (!root) return
      const px = `${width}px`
      root
        .querySelectorAll<HTMLElement>(
          `col[data-column-id="${columnId}"], th[data-column-id="${columnId}"], td[data-column-id="${columnId}"]`
        )
        .forEach((el) => {
          el.style.width = px
          el.style.minWidth = px
        })
    },
    []
  )

  const startCustomResize = React.useCallback(
    (columnId: string, startX: number, startWidth: number) => {
      const def = table.getColumn(columnId)?.columnDef as
        | { minSize?: number; maxSize?: number }
        | undefined
      const minSize = def?.minSize ?? 40
      const maxSize = def?.maxSize ?? 9999
      resizeStateRef.current = {
        columnId,
        startX,
        startWidth,
        minSize,
        maxSize,
        lastWidth: startWidth,
      }
      setResizingColumnId(columnId)
      const move = (e: MouseEvent) => {
        const s = resizeStateRef.current
        if (!s) return
        const delta = e.clientX - s.startX
        const w = Math.min(
          s.maxSize,
          Math.max(s.minSize, s.startWidth + delta)
        )
        s.lastWidth = Math.round(w)
        applyColumnWidth(s.columnId, w)
      }
      const up = () => {
        const s = resizeStateRef.current
        if (s && onColumnResizeEnd) onColumnResizeEnd(s.columnId, s.lastWidth)
        resizeStateRef.current = null
        setResizingColumnId(null)
        document.removeEventListener("mousemove", move)
        document.removeEventListener("mouseup", up)
      }
      document.addEventListener("mousemove", move)
      document.addEventListener("mouseup", up)
    },
    [table, onColumnResizeEnd, applyColumnWidth]
  )

  const canReorder = Boolean(reorderColumn)
  const nonReorderableSet = React.useMemo(
    () => new Set(nonReorderableColumnIds),
    [nonReorderableColumnIds]
  )

  const handleReorder = React.useCallback(
    (movingId: string, targetId: string) => {
      if (movingId === targetId || nonReorderableSet.has(movingId) || nonReorderableSet.has(targetId)) return
      reorderColumn?.(movingId, targetId)
    },
    [reorderColumn, nonReorderableSet]
  )

  const columns = table.getAllLeafColumns()
  const columnCount = columns.length

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "rounded-lg border border-border/50 bg-background shadow-xs overflow-hidden",
        stickyHeader ? "overflow-visible" : "overflow-x-auto",
        wrapperClassName
      )}
    >
      <Table
        className={cn("min-w-max", tableClassName)}
        containerId={stickyHeader ? undefined : scrollAreaId}
        containerClassName={stickyHeader ? "overflow-visible" : undefined}
      >
        <colgroup>
          {table.getHeaderGroups()[0]?.headers.map((header) => {
            const width =
              typeof header.column.getSize === "function"
                ? header.column.getSize()
                : (header.column.columnDef as { size?: number }).size
            return (
              <col
                key={header.id}
                data-column-id={header.column.id}
                style={width ? { width: width, minWidth: width } : undefined}
              />
            )
          })}
        </colgroup>
        <TableHeader
          className={cn(
            "bg-muted/30",
            stickyHeader &&
            "sticky top-0 z-10 bg-background/95 backdrop-blur-sm shadow-[0_1px_0_0_hsl(var(--border)/0.5)] supports-[backdrop-filter]:bg-background/80"
          )}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-border/50 hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const canReorderCol =
                  canReorder && !nonReorderableSet.has(header.column.id)
                const reorderableIds = headerGroup.headers
                  .filter((h) => !nonReorderableSet.has(h.column.id))
                  .map((h) => h.column.id)
                const leftmostId = reorderableIds[0]
                const rightmostId = reorderableIds[reorderableIds.length - 1]
                const isLeftmost = header.column.id === leftmostId
                const isRightmost = header.column.id === rightmostId
                const columnLabel =
                  (header.column.columnDef.meta as { label?: string } | undefined)
                    ?.label ?? header.column.id
                const isHeaderPressed = headerPressedColumnId === header.column.id
                const isDragging = draggingColumnId === header.column.id
                const isDropTarget =
                  dropTargetColumnId === header.column.id &&
                  draggingColumnId !== header.column.id
                const movingColumnLabel =
                  draggingColumnId
                    ? (table.getColumn(draggingColumnId)?.columnDef.meta as
                      | { label?: string }
                      | undefined)?.label ?? draggingColumnId
                    : ""

                const columnWidth =
                  typeof header.column.getSize === "function"
                    ? header.column.getSize()
                    : (header.column.columnDef as { size?: number }).size
                const canResize =
                  typeof header.column.getCanResize === "function"
                    ? header.column.getCanResize()
                    : false
                const isResizing =
                  resizingColumnId === header.column.id ||
                  (typeof header.column.getIsResizing === "function" &&
                    header.column.getIsResizing())
                return (
                  <TableHead
                    key={header.id}
                    data-column-id={header.column.id}
                    className={cn(
                      "relative transition-colors duration-200 h-10 px-3 text-xs font-medium text-muted-foreground select-none",
                      isHeaderPressed && "bg-accent/50",
                      isDragging &&
                      "border-2 border-dashed border-primary/20 bg-accent/30 min-w-[80px]",
                      isDropTarget && "bg-accent/30 box-border border-l-2 border-primary",
                      isResizing && "bg-accent/10 border-r-2 border-primary/50"
                    )}
                    style={{
                      width: columnWidth ?? undefined,
                      minWidth: columnWidth ?? undefined,
                    }}
                    onDragOver={
                      canReorderCol
                        ? (e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = "move"
                          setDropTargetColumnId(header.column.id)
                        }
                        : undefined
                    }
                    onDrop={
                      canReorderCol
                        ? (e) => {
                          e.preventDefault()
                          setDropTargetColumnId(null)
                          const movingId = e.dataTransfer.getData("text/plain")
                          const targetId = header.column.id
                          if (
                            movingId &&
                            targetId &&
                            movingId !== targetId
                          ) {
                            handleReorder(movingId, targetId)
                          }
                        }
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "relative flex items-center gap-2 overflow-visible",
                          canReorderCol &&
                          "cursor-grab active:cursor-grabbing touch-none"
                        )}
                        draggable={canReorderCol}
                        onMouseDown={
                          canReorderCol
                            ? () => setHeaderPressedColumnId(header.column.id)
                            : undefined
                        }
                        onMouseUp={
                          canReorderCol
                            ? () => setHeaderPressedColumnId(null)
                            : undefined
                        }
                        onMouseLeave={
                          canReorderCol
                            ? () => setHeaderPressedColumnId(null)
                            : undefined
                        }
                        onDragStart={
                          canReorderCol
                            ? (e) => {
                              setHeaderPressedColumnId(null)
                              e.dataTransfer.setData(
                                "text/plain",
                                header.column.id
                              )
                              e.dataTransfer.effectAllowed = "move"

                              // Refined drag ghost
                              const headerEl = document.querySelector(
                                `th[data-column-id="${header.column.id}"]`
                              ) as HTMLElement | null
                              const cellEls = document.querySelectorAll(
                                `td[data-column-id="${header.column.id}"]`
                              )
                              const colSize =
                                (header.column.columnDef as { size?: number })
                                  .size ?? 120

                              const container = document.createElement("div")
                              container.style.cssText =
                                "position: absolute; top: -9999px; left: 0; border-radius: 6px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); pointer-events: none; min-width: " +
                                colSize +
                                "px; max-width: " +
                                colSize +
                                "px; background: var(--background); border: 1px solid var(--border);"

                              const previewTable =
                                document.createElement("table")
                              previewTable.className = "w-full text-sm"
                              previewTable.style.width = colSize + "px"
                              previewTable.style.tableLayout = "fixed"

                              if (headerEl) {
                                const thead = document.createElement("thead")
                                const headerRow =
                                  document.createElement("tr")
                                const headerClone = headerEl.cloneNode(
                                  true
                                ) as HTMLElement
                                headerClone.style.background = "hsl(var(--muted))"
                                headerClone.style.color = "hsl(var(--foreground))"
                                headerClone.style.border = "none"
                                headerRow.appendChild(headerClone)
                                thead.appendChild(headerRow)
                                previewTable.appendChild(thead)
                              }

                              const tbody = document.createElement("tbody")
                              const maxRows = Math.min(6, cellEls.length)
                              for (let i = 0; i < maxRows; i++) {
                                const tr = document.createElement("tr")
                                const cellClone = cellEls[i].cloneNode(
                                  true
                                ) as HTMLElement
                                cellClone
                                  .querySelectorAll(
                                    "button, [role='button']"
                                  )
                                  .forEach((el) => el.remove())
                                cellClone.style.background = "hsl(var(--background))"
                                tr.appendChild(cellClone)
                                tbody.appendChild(tr)
                              }
                              previewTable.appendChild(tbody)
                              container.appendChild(previewTable)
                              document.body.appendChild(container)

                              e.dataTransfer.setDragImage(
                                container,
                                Math.floor(colSize / 2),
                                20
                              )
                              setDraggingColumnId(header.column.id)
                              requestAnimationFrame(() => container.remove())
                            }
                            : undefined
                        }
                        onDragEnd={
                          canReorderCol
                            ? () => {
                              setDraggingColumnId(null)
                              setDropTargetColumnId(null)
                            }
                            : undefined
                        }
                      >
                        <AnimatePresence>
                          {isHeaderPressed && canReorderCol && (
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.95 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                              }}
                              className="absolute left-1/2 -translate-x-1/2 -bottom-10 z-20 flex items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-1.5 text-[10px] font-medium text-background shadow-lg backdrop-blur-sm"
                            >
                              {!isLeftmost && (
                                <motion.div
                                  animate={{ x: [-2, 2, -2] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "easeInOut",
                                  }}
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </motion.div>
                              )}
                              <span>
                                {isLeftmost && !isRightmost
                                  ? "Drag right"
                                  : isRightmost && !isLeftmost
                                    ? "Drag left"
                                    : "Drag to reorder"}
                              </span>
                              {!isRightmost && (
                                <motion.div
                                  animate={{ x: [2, -2, 2] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "easeInOut",
                                  }}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {isDragging ? (
                          <div className="flex min-h-[28px] items-center justify-center text-xs text-muted-foreground italic">
                            Reordering…
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </div>
                    )}
                    {canResize && (
                      <div
                        className={cn(
                          "absolute right-0 top-0 bottom-0 z-[5] flex w-4 -translate-x-1/2 cursor-col-resize items-center justify-center select-none touch-none opacity-0 transition-opacity hover:opacity-100 group-hover/th:opacity-100",
                          isResizing && "opacity-100"
                        )}
                        onMouseDown={
                          onColumnResizeEnd
                            ? (e) => {
                              e.preventDefault()
                              const startWidth =
                                typeof header.column.getSize === "function"
                                  ? header.column.getSize()
                                  : (header.column.columnDef as { size?: number })
                                    .size ?? 150
                              startCustomResize(
                                header.column.id,
                                e.clientX,
                                startWidth
                              )
                            }
                            : header.getResizeHandler()
                        }
                        onTouchStart={
                          onColumnResizeEnd ? undefined : header.getResizeHandler()
                        }
                        onClick={(e) => e.stopPropagation()} // Prevent sort trigger
                      >
                        <div
                          className={cn(
                            "h-5 w-1 rounded-full bg-border transition-colors hover:bg-foreground/50",
                            isResizing && "bg-primary h-full w-0.5"
                          )}
                        />
                      </div>
                    )}
                    {isDropTarget && draggingColumnId && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 rounded-md bg-foreground px-3 py-1.5 text-[10px] font-medium text-background shadow-xl"
                      >
                        Drop here
                      </motion.div>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const cells = row.getVisibleCells().map((cell) => {
                const isColumnDragging = draggingColumnId === cell.column.id
                const isDropTarget =
                  dropTargetColumnId === cell.column.id &&
                  draggingColumnId &&
                  draggingColumnId !== cell.column.id
                return (
                  <TableCell
                    key={cell.id}
                    data-column-id={cell.column.id}
                    className={cn(
                      "py-2.5 px-3 transition-colors",
                      isColumnDragging && "bg-muted/30 opacity-50",
                      isDropTarget && "bg-accent/10 border-l-2 border-primary"
                    )}
                  >
                    {isColumnDragging ? (
                      <div className="min-h-[24px]" />
                    ) : (
                      flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )
                    )}
                  </TableCell>
                )
              })

              if (renderRowWrapper) {
                return (
                  <React.Fragment key={row.id}>
                    {renderRowWrapper(row, cells)}
                  </React.Fragment>
                )
              }
              return (
                <motion.tr
                  key={row.id}
                  data-slot="table-row"
                  data-state={row.getIsSelected?.() && "selected"}
                  className={cn(
                    "group border-b border-border/50 transition-colors bg-background",
                    "hover:bg-muted/30",
                    row.getIsSelected?.() && "bg-muted/40 hover:bg-muted/50"
                  )}
                >
                  {cells}
                </motion.tr>
              )
            })
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <div className="rounded-full bg-muted/50 p-3">
                    <Inbox className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {scrollAreaId && !stickyHeader && (
        <ShiftWheelScroll scrollAreaId={scrollAreaId} />
      )}
    </div>
  )
}
