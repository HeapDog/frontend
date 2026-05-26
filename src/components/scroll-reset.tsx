"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

function ScrollResetContent({ scrollAreaId }: { scrollAreaId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const scrollArea = document.getElementById(scrollAreaId)
    if (scrollArea) {
      scrollArea.scrollTop = 0
    }
  }, [pathname, searchParams, scrollAreaId])

  return null
}

export function ScrollReset({ scrollAreaId }: { scrollAreaId: string }) {
  return (
    <Suspense fallback={null}>
      <ScrollResetContent scrollAreaId={scrollAreaId} />
    </Suspense>
  )
}
