"use client";

import React from "react";
import Link from "next/link";
import { 
  Building2, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden bg-background py-16 px-4">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />
      
      {/* Modern Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="w-full max-w-2xl text-center relative z-10 flex flex-col items-center">
        
        {/* Status Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-muted/50 backdrop-blur-xs text-xs font-semibold text-primary/90 border-primary/20 mb-8"
        >
          <Clock className="size-3.5" />
          SCHEDULED MAINTENANCE
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground"
        >
          System Optimization in Progress
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-foreground text-base sm:text-lg leading-relaxed mt-4 max-w-lg"
        >
          The core coding workspaces, compilation engines, and competitive battle arenas are currently offline as we deploy backend upgrades.
        </motion.p>

        {/* Action Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mt-10 bg-card/65 border border-border/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md text-left shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Building2 className="text-primary size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Organizations Fully Accessible
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <ShieldCheck className="size-3" /> Active
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-medium">
                Organization spaces, team membership management, and invitation controls are completely unaffected. You can continue structuring your teams and configuring settings without interruption.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-muted-foreground font-semibold">All team operations are online and secure</span>
            </div>
            
            <Button asChild className="w-full sm:w-auto font-semibold bg-primary hover:bg-primary/95 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-primary/10">
              <Link href="/organizations" className="flex items-center justify-center gap-2">
                Manage Organizations <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-xs text-muted-foreground/50 font-medium mt-12 w-full max-w-md border-t border-border/40 pt-4"
        >
          HeapDog Inc. &copy; 2026. All organization data remains isolated and fully operational.
        </motion.div>
      </div>
    </div>
  );
}
