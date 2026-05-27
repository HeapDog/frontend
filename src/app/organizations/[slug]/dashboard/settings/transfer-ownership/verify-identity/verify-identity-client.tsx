"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

interface VerifyIdentityClientProps {
  slug: string;
  orgName: string;
  selectedMemberId: string;
}

export function VerifyIdentityClient({ slug, orgName, selectedMemberId }: VerifyIdentityClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleVerifyIdentity = () => {
    setIsProcessing(true);

    // Save final step and selected member in redirect url
    const targetRedirect = `/organizations/${slug}/dashboard/settings/transfer-ownership/confirm?selectedMemberId=${selectedMemberId}`;
    
    // Redirect to re-authenticate with prompt=login
    window.location.href = `/signin?prompt=login&next=${encodeURIComponent(targetRedirect)}`;
  };

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("heapdog-transfer-set-step", { detail: 1 }));
      window.dispatchEvent(new CustomEvent("heapdog-transfer-loading-step", { detail: 1 }));
    }
    startTransition(() => {
      router.push(`/organizations/${slug}/dashboard/settings/transfer-ownership/select-member`);
    });
  };

  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center justify-center p-12 bg-neutral-50/50 dark:bg-neutral-900/10 border border-border/40 rounded-3xl space-y-4.5 text-center min-h-[320px]"
      >
        <Spinner className="w-7 h-7 text-primary animate-spin" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground tracking-tight">Redirecting to Secure Server...</p>
          <p className="text-[10px] text-muted-foreground leading-normal max-w-[280px]">Connecting to the secure Heapdog identity provider to confirm your session.</p>
        </div>
      </motion.div>
    );
  }

  if (isPending) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center justify-center p-12 bg-neutral-50/50 dark:bg-neutral-900/10 border border-border/40 rounded-3xl space-y-4.5 text-center min-h-[320px]"
      >
        <Spinner className="w-7 h-7 text-primary animate-spin" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground tracking-tight">Returning to Select Member...</p>
          <p className="text-[10px] text-muted-foreground leading-normal max-w-[280px]">Loading organization membership list.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Central Visual Lock/Identity Card */}
      <div className="flex flex-col items-center justify-center p-8 bg-neutral-50/50 dark:bg-neutral-900/15 border border-border/50 rounded-3xl space-y-6 text-center select-none shadow-2xs">
        {/* Apple Style Gilded Lock Container */}
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs animate-pulse">
          <Lock className="w-6.5 h-6.5 stroke-[1.5]" />
        </div>

        <div className="space-y-2 max-w-md">
          <h4 className="text-sm font-bold text-foreground tracking-tight">Identity Re-Verification Required</h4>
          <p className="text-xs leading-relaxed text-muted-foreground">
            To authorize transferring ownership of <strong className="text-foreground font-semibold">{orgName}</strong>, organization security protocols require you to verify your identity via a fresh secure session.
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground/80 pt-1">
            You will be redirected briefly to our verification gateway and returned automatically upon success.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-3">
        <Button
          type="button"
          disabled={isProcessing || isPending}
          onClick={handleBack}
          className="cursor-pointer text-xs font-semibold rounded-full px-5 h-9.5 transition-all duration-200 ease-in-out active:scale-[0.98] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900 gap-1.5 flex items-center justify-center shadow-xs"
        >
          {isPending ? (
            <Spinner className="w-3.5 h-3.5 text-current animate-spin" />
          ) : (
            <ArrowLeft className="w-3.5 h-3.5" />
          )}
          <span>Back</span>
        </Button>
        <Button
          type="button"
          onClick={handleVerifyIdentity}
          disabled={isProcessing || isPending}
          className="cursor-pointer font-semibold text-xs rounded-full px-5.5 h-9.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/10 active:scale-[0.98] transition-all duration-200 gap-1.5 flex items-center justify-center"
        >
          {isProcessing ? (
            <Spinner className="w-3.5 h-3.5 text-current animate-spin" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5" />
          )}
          <span>Verify Identity</span>
        </Button>
      </div>
    </motion.div>
  );
}
