"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react"

export interface BreadcrumbNavData {
  title: string
  href?: string
  items?: BreadcrumbNavData[]
}

interface NavBreadcrumbsProps {
  items: BreadcrumbNavData[]
  baseBreadcrumbs?: React.ReactNode
}

export function NavBreadcrumbs({ items, baseBreadcrumbs }: NavBreadcrumbsProps) {
  const pathname = usePathname()

  // Helper to find the path to the active item
  const findPath = (
    currentItems: BreadcrumbNavData[],
    targetPath: string,
    currentPath: BreadcrumbNavData[] = []
  ): BreadcrumbNavData[] | null => {
    for (const item of currentItems) {
      // Check if this item matches
      if (item.href === targetPath) {
        return [...currentPath, item]
      }

      // Check nested items
      if (item.items) {
        const result = findPath(item.items, targetPath, [...currentPath, item])
        if (result) return result
      }
    }
    return null
  }

  // Try to find exact match first
  let activePath = findPath(items, pathname)
  
  // If no exact match, try to find partial match (for sub-pages)
  // But careful not to match root "/" against everything
  if (!activePath) {
      // Sort items by href length descending to match most specific first
      // This is tricky with the recursive structure, so we might just rely on exact matches for now
      // or simple startsWith for leaf nodes
      
      const findPartialPath = (
        currentItems: BreadcrumbNavData[], 
        targetPath: string,
        currentPath: BreadcrumbNavData[] = []
      ): BreadcrumbNavData[] | null => {
        for (const item of currentItems) {
           if (item.href && targetPath.startsWith(item.href) && item.href !== '/') {
               // If this is a leaf or we want to show path to a parent section
               // Ideally we want the deepest match
                const extendedPath = [...currentPath, item];
                // Check children for a better match
                if (item.items) {
                    const childMatch = findPartialPath(item.items, targetPath, extendedPath);
                    if (childMatch) return childMatch;
                }
                return extendedPath;
           }
           if (item.items) {
               const result = findPartialPath(item.items, targetPath, [...currentPath, item]);
               if (result) return result;
           }
        }
        return null;
      }
      activePath = findPartialPath(items, pathname);
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {baseBreadcrumbs}
        
        {activePath && activePath.length > 0 && (
            <>
             {baseBreadcrumbs && <BreadcrumbSeparator className="hidden md:block" />}
             {activePath.map((item, index) => {
                const isLast = index === activePath.length - 1
                const isFirst = index === 0
                
                return (
                    <Fragment key={item.title}>
                        {!isFirst && <BreadcrumbSeparator className="hidden md:block" />}
                        <BreadcrumbItem className="hidden md:block">
                            {isLast ? (
                                <BreadcrumbPage>{item.title}</BreadcrumbPage>
                            ) : (
                                item.href ? (
                                    <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
                                ) : (
                                    <BreadcrumbPage className="text-muted-foreground">{item.title}</BreadcrumbPage>
                                )
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                )
             })}
            </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}


