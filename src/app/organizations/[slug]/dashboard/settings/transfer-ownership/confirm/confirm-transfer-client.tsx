"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  ArrowLeft, 
  UserCheck, 
  ShieldCheck,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface MemberItem {
  id: string; // userId
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface ConfirmTransferClientProps {
  slug: string;
  orgName: string;
  selectedMember: MemberItem;
}

export function ConfirmTransferClient({ slug, orgName, selectedMember }: ConfirmTransferClientProps) {
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const getInitials = (m: MemberItem) => {
    if (m.firstName && m.lastName) {
      return (m.firstName[0] + m.lastName[0]).toUpperCase();
    }
    return m.username.substring(0, 2).toUpperCase();
  };

  const handleConfirmTransfer = async () => {
    if (confirmText !== "transfer") {
      toast.error("Please type the confirmation word exactly.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/organizations/${slug}/transfer-ownership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newOwnerId: selectedMember.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsConfirmOpen(false);
        setShowSuccess(true);
        toast.success("Ownership successfully transferred!", {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-500 animate-bounce" />
        });

        // Dispatch custom event to force layouts and sidebar to synchronize
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("heapdog-org-state-change"));
        }

        // Hard reload the page after 3 seconds to force a complete fresh render of the workspace and header contexts
        setTimeout(() => {
          window.location.href = `/organizations/${slug}/dashboard/basic-info`;
        }, 3000);
      } else {
        toast.error(data.error || "Failed to transfer ownership.");
      }
    } catch (e) {
      console.error("Error executing transfer:", e);
      toast.error("An unexpected error occurred during transfer.");
    } finally {
      setIsProcessing(false);
    }
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
          <p className="text-[10px] text-muted-foreground leading-normal max-w-[280px]">Loading organization membership roster.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {!showSuccess ? (
        <motion.div
          key="confirm-wizard"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Central Visual Alert Card */}
          <div className="flex flex-col items-center justify-center p-8 bg-neutral-50/50 dark:bg-neutral-900/15 border border-border/50 rounded-3xl space-y-6 text-center select-none shadow-2xs">
            {/* Pulsing red security shield icon container */}
            <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs animate-pulse">
              <ShieldAlert className="w-6.5 h-6.5 stroke-[1.5]" />
            </div>

            <div className="space-y-2 max-w-md">
              <h4 className="text-sm font-bold text-foreground tracking-tight">Final Confirmation Required</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This action is permanent and completely irreversible. You will instantly transfer all primary organization administrative privileges for <strong className="text-foreground font-semibold">{orgName}</strong>.
              </p>
            </div>
          </div>

          {/* Visual Recipient Verification Row */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-neutral-50/50 dark:bg-neutral-900/30 select-none shadow-3xs">
            <div className="flex items-center gap-3.5">
              <Avatar className="size-10 rounded-xl border border-primary/10 shadow-xs">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {getInitials(selectedMember)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground tracking-tight">
                  {selectedMember.firstName && selectedMember.lastName ? `${selectedMember.firstName} ${selectedMember.lastName}` : selectedMember.username}
                </span>
                <span className="text-xs text-muted-foreground truncate leading-none mt-1">{selectedMember.email}</span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/15 px-2.5 py-0.5 rounded-md uppercase tracking-wider scale-95 shrink-0 select-none">
              Recipient
            </span>
          </div>

          {/* Actions */}
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
              onClick={() => {
                setConfirmText("");
                setIsConfirmOpen(true);
              }}
              disabled={isPending}
              className="cursor-pointer font-semibold text-xs rounded-full px-5.5 h-9.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/10 active:scale-[0.98] transition-all duration-200 gap-1.5 flex items-center justify-center"
            >
              <span>Confirm & Execute</span>
              <UserCheck className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="success-wizard"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center text-center p-8 bg-neutral-100/10 dark:bg-neutral-900/10 border border-border/50 rounded-3xl space-y-5 shadow-xs"
        >
          {/* Pulsing visual checkmark */}
          <div className="relative flex items-center justify-center size-16 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            <div className="absolute inset-0 size-16 rounded-full bg-emerald-500/10 blur-md animate-pulse -z-10" />
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-base font-bold text-foreground">Ownership Transferred Successfully</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Organization <strong className="text-foreground font-medium">{orgName}</strong> is now owned by <strong className="text-foreground font-medium">{selectedMember.firstName && selectedMember.lastName ? `${selectedMember.firstName} ${selectedMember.lastName}` : selectedMember.username}</strong>. 
              Your privileges have been adjusted to standard member configurations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground select-none pt-2">
            <Spinner className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Redirecting to basic info dashboard...</span>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Confirmation Dialog Modal */}
      <Dialog 
        open={isConfirmOpen} 
        onOpenChange={(open) => {
          if (!isProcessing) {
            setIsConfirmOpen(open);
          }
        }}
      >
        <DialogContent 
          showCloseButton={!isProcessing}
          className="max-w-md overflow-hidden rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/98 dark:bg-neutral-950/95 p-7 shadow-2xl space-y-6 select-none backdrop-blur-xl"
        >
          {/* Header section with alert */}
          <div className="flex flex-col items-center text-center space-y-3.5 pt-2 w-full">
            <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 dark:bg-destructive/10 text-rose-600 dark:text-destructive border border-rose-500/15 dark:border-destructive/15 shadow-2xs">
              <ShieldAlert className="size-5 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-foreground tracking-tight">Confirm Ownership Transfer</h3>
              <p className="text-xs text-neutral-500 dark:text-muted-foreground leading-normal max-w-xs">
                This action is permanent and cannot be undone. Please verify the recipient below to authorize.
              </p>
            </div>
          </div>

          {/* Visual Recipient Verification Row */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-850 bg-neutral-50/60 dark:bg-neutral-900/20 w-full select-none shadow-3xs">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 rounded-lg border border-primary/10 shadow-3xs">
                <AvatarFallback className="bg-primary/10 dark:bg-primary/5 text-primary text-xs font-semibold">
                  {getInitials(selectedMember)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-semibold text-neutral-900 dark:text-foreground tracking-tight">
                  {selectedMember.firstName && selectedMember.lastName ? `${selectedMember.firstName} ${selectedMember.lastName}` : selectedMember.username}
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-muted-foreground truncate mt-0.5">{selectedMember.email}</span>
              </div>
            </div>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider select-none">
              Recipient
            </span>
          </div>

          {/* Consequence Instructions Card with strict copy prevention */}
          <div 
            onCopy={(e) => e.preventDefault()}
            className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50/40 dark:bg-neutral-900/10 border border-neutral-200/40 dark:border-border/30 rounded-xl p-4 leading-relaxed select-none w-full text-center"
          >
            <p>
              To confirm, type <span className="font-semibold text-neutral-900 dark:text-foreground select-none pointer-events-none">"transfer"</span> below.
            </p>
          </div>

          {/* Confirmation Input Field */}
          <div className="space-y-1.5 w-full">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-muted-foreground/60 pl-0.5">
              Verification
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder="Type transfer"
              disabled={isProcessing}
              className="w-full text-xs rounded-xl border bg-neutral-50/50 dark:bg-neutral-950/30 border-neutral-200 dark:border-border/70 px-3.5 py-2.5 text-neutral-900 dark:text-foreground placeholder:text-neutral-400 dark:placeholder:text-muted-foreground/30 transition-all duration-150 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-2 focus:ring-neutral-200/70 dark:focus:ring-neutral-800 disabled:opacity-50 font-medium"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2 w-full">
            <Button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsConfirmOpen(false)}
              className="cursor-pointer text-xs rounded-full px-4.5 h-9 bg-rose-500/10 hover:bg-rose-500/15 dark:bg-destructive/10 dark:hover:bg-destructive/15 text-rose-600 dark:text-destructive border border-rose-500/15 dark:border-destructive/15 active:scale-[0.98] transition-all duration-200 gap-1.5 flex items-center justify-center font-medium shadow-3xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Button>
            <Button
              type="button"
              disabled={confirmText !== "transfer" || isProcessing}
              onClick={handleConfirmTransfer}
              className="cursor-pointer text-xs font-semibold rounded-full px-5 h-9 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 gap-1.5 flex items-center justify-center shadow-sm shadow-primary/10 active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Spinner className="w-3.5 h-3.5 text-current animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <span>Transfer Ownership</span>
                  <UserCheck className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
