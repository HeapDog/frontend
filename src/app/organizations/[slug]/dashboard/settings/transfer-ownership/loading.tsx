"use client";

import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

export default function TransferOwnershipLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col items-center justify-center p-12 bg-neutral-100/10 dark:bg-neutral-900/10 border border-border/40 rounded-3xl space-y-4 text-center min-h-[300px]"
    >
      <Spinner className="w-8 h-8 text-primary animate-spin" />
      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Loading Transfer Session...</p>
        <p className="text-[10px] text-muted-foreground">Preparing workspace and verifying authorization credentials.</p>
      </div>
    </motion.div>
  );
}
