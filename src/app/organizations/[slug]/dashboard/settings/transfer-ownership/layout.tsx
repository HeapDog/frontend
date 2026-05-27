"use client";

import { use, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  Check, 
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default function TransferOwnershipLayout({ children, params }: LayoutProps) {
  const { slug } = use(params);
  const pathname = usePathname();

  let step: 1 | 2 | 3 = 1;
  if (pathname.endsWith("/verify-identity")) {
    step = 2;
  } else if (pathname.endsWith("/confirm")) {
    step = 3;
  }

  const [optimisticStep, setOptimisticStep] = useState<1 | 2 | 3 | null>(null);
  const [loadingStep, setLoadingStep] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    setOptimisticStep(null);
    setLoadingStep(null);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleSetStep = (e: Event) => {
        const stepDetail = (e as CustomEvent).detail;
        if (stepDetail === 1 || stepDetail === 2 || stepDetail === 3) {
          setOptimisticStep(stepDetail);
        }
      };
      const handleLoadingStep = (e: Event) => {
        const stepDetail = (e as CustomEvent).detail;
        if (stepDetail === 1 || stepDetail === 2 || stepDetail === 3 || stepDetail === null) {
          setLoadingStep(stepDetail);
        }
      };
      window.addEventListener("heapdog-transfer-set-step", handleSetStep);
      window.addEventListener("heapdog-transfer-loading-step", handleLoadingStep);
      return () => {
        window.removeEventListener("heapdog-transfer-set-step", handleSetStep);
        window.removeEventListener("heapdog-transfer-loading-step", handleLoadingStep);
      };
    }
  }, []);

  const currentActiveStep = optimisticStep || step;

  return (
    <div className="relative w-full max-w-2xl mx-auto space-y-8 select-none px-4 py-6">
      {/* Visual background radial glow */}
      <div 
        className="absolute inset-0 -z-10 h-full w-full opacity-[0.03] dark:opacity-[0.04] pointer-events-none transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Header Info */}
      <div className="flex flex-col space-y-1.5 pb-4 border-b border-border/40">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Transfer Organization Ownership
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Transfer primary administrative credentials and ownership privileges of this organization.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="space-y-3.5 select-none">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">
          <span>Ownership Transfer Wizard</span>
          <span className="text-primary font-extrabold tracking-tight">Step {currentActiveStep} of 3</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { number: 1, label: "Select Member" },
            { number: 2, label: "Verify Identity" },
            { number: 3, label: "Confirm Transfer" },
          ].map((s) => {
            const isActive = currentActiveStep === s.number;
            const isCompleted = currentActiveStep > s.number;
            const isLoading = loadingStep === s.number;
            return (
              <div key={s.number} className="space-y-2 flex flex-col">
                <div 
                  className={cn(
                    "h-1 rounded-full transition-all duration-500 ease-in-out relative overflow-hidden",
                    isActive
                      ? "bg-primary shadow-[0_0_8px_rgba(139,92,246,0.35)]"
                      : isCompleted
                      ? "bg-emerald-500"
                      : "bg-neutral-200 dark:bg-neutral-800"
                  )}
                >
                  {isLoading && (
                    <motion.div 
                      className="absolute inset-0 bg-white/30 dark:bg-white/20"
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
                <span 
                  className={cn(
                    "text-[10px] font-bold tracking-tight transition-colors duration-300 pl-0.5",
                    isActive
                      ? "text-foreground"
                      : isCompleted
                      ? "text-emerald-500"
                      : "text-muted-foreground/40"
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stepper active page content */}
      <div>
        {children}
      </div>
    </div>
  );
}
