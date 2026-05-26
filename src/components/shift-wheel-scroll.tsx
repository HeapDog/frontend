"use client"

import { useEffect } from "react"

/**
 * Enables Shift+wheel to scroll horizontally on a scroll container.
 * Browsers don't consistently translate Shift+wheel to horizontal scroll,
 * so we manually convert vertical wheel delta to horizontal scrollLeft.
 */
export function ShiftWheelScroll({ scrollAreaId }: { scrollAreaId: string }) {
  useEffect(() => {
    const el = document.getElementById(scrollAreaId)
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return

      const canScrollLeft = el.scrollLeft > 0
      const canScrollRight =
        el.scrollLeft < el.scrollWidth - el.clientWidth - 1

      if (
        (e.deltaY > 0 && canScrollRight) ||
        (e.deltaY < 0 && canScrollLeft)
      ) {
        e.preventDefault()
        e.stopPropagation()
        el.scrollLeft += e.deltaY
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: false, capture: true })

    return () =>
      el.removeEventListener("wheel", handleWheel, { capture: true })
  }, [scrollAreaId])

  return null
}
