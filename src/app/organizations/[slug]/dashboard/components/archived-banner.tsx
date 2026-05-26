"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ArchivedBannerProps {
  slug: string;
}

export function ArchivedBanner({ slug }: ArchivedBannerProps) {
  const [isArchived, setIsArchived] = useState(false);

  const checkArchived = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const archivedList = localStorage.getItem("heapdog:archived_orgs");
        if (archivedList) {
          const parsed = JSON.parse(archivedList) as string[];
          setIsArchived(parsed.includes(slug));
        } else {
          setIsArchived(false);
        }
      } catch (e) {
        setIsArchived(false);
      }
    }
  }, [slug]);

  useEffect(() => {
    checkArchived();
    if (typeof window !== "undefined") {
      window.addEventListener("heapdog-org-state-change", checkArchived);
      window.addEventListener("storage", checkArchived);
      return () => {
        window.removeEventListener("heapdog-org-state-change", checkArchived);
        window.removeEventListener("storage", checkArchived);
      };
    }
  }, [checkArchived]);

  return (
    <AnimatePresence>
      {isArchived && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] text-amber-600 dark:text-amber-450 text-xs font-medium tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span className="leading-relaxed">
              This organization is currently archived. All modification, creation, or deletion capabilities are suspended.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
