"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, 
  Archive, 
  Trash2, 
  Loader2, 
  ShieldAlert, 
  Check, 
  ArrowRight,
  RefreshCcw,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMyPermissions } from "@/hooks/use-my-permissions";
import { ErrorView } from "@/components/error-view";
import { Spinner } from "@/components/ui/spinner";

interface DangerZoneViewProps {
  slug: string;
  orgName: string;
}

export function DangerZoneView({ slug, orgName }: DangerZoneViewProps) {
  const { check, isLoading } = useMyPermissions(slug);
  const router = useRouter();
  const [isArchived, setIsArchived] = useState(false);
  
  // Dialog Open States
  const [showArchiveAlert, setShowArchiveAlert] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Deletion Validation Input
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Load archived state on mount
  useEffect(() => {
    const archivedList = localStorage.getItem("heapdog:archived_orgs");
    if (archivedList) {
      try {
        const parsed = JSON.parse(archivedList) as string[];
        setIsArchived(parsed.includes(slug));
      } catch (e) {
        console.error("Failed to parse archived organizations", e);
      }
    }
  }, [slug]);

  // Dispatch custom event to sync sidebar and layout
  const notifyStateChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("heapdog-org-state-change"));
    }
  };

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    // Mimic API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const archivedList = localStorage.getItem("heapdog:archived_orgs");
      let currentArchived: string[] = [];
      
      if (archivedList) {
        currentArchived = JSON.parse(archivedList) as string[];
      }

      if (isArchived) {
        // Restore
        const updated = currentArchived.filter((s) => s !== slug);
        localStorage.setItem("heapdog:archived_orgs", JSON.stringify(updated));
        setIsArchived(false);
        toast.success(`Organization "${orgName}" successfully restored to active state`, {
          icon: <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
        });
      } else {
        // Archive
        if (!currentArchived.includes(slug)) {
          currentArchived.push(slug);
        }
        localStorage.setItem("heapdog:archived_orgs", JSON.stringify(currentArchived));
        setIsArchived(true);
        toast.warning(`Organization "${orgName}" is now archived and read-only`, {
          icon: <Archive className="w-4 h-4 text-amber-500" />
        });
      }
      notifyStateChange();
    } catch (e) {
      toast.error("Failed to modify organization state");
    } finally {
      setIsArchiving(false);
      setShowArchiveAlert(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (deleteConfirmText !== orgName) {
      toast.error("Confirmation name mismatch. Please type the exact organization name.");
      return;
    }

    setIsDeleting(true);
    // Mimic API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const deletedList = localStorage.getItem("heapdog:deleted_orgs") || "[]";
      const currentDeleted = JSON.parse(deletedList) as string[];
      
      if (!currentDeleted.includes(slug)) {
        currentDeleted.push(slug);
      }
      localStorage.setItem("heapdog:deleted_orgs", JSON.stringify(currentDeleted));
      
      // Clean up archived list just in case
      const archivedList = localStorage.getItem("heapdog:archived_orgs");
      if (archivedList) {
        const parsed = JSON.parse(archivedList) as string[];
        localStorage.setItem("heapdog:archived_orgs", JSON.stringify(parsed.filter((s) => s !== slug)));
      }

      toast.success(`Organization "${orgName}" has been permanently deleted`, {
        icon: <Trash2 className="w-4 h-4 text-red-500" />
      });
      
      notifyStateChange();
      setShowDeleteDialog(false);
      
      // Redirect back to main dashboard
      router.push("/organizations");
      router.refresh();
    } catch (e) {
      toast.error("An error occurred while deleting the organization.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!check("lifecycle:manage")) {
    return (
      <ErrorView
        error={{
          timestamp: new Date().toISOString(),
          status: 403,
          error: "Forbidden",
          code: "FORBIDDEN",
          message: "You do not have permission to access the danger zone.",
          details: null,
          path: `/organizations/${slug}/dashboard/settings/danger-zone`,
        }}
      />
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto space-y-8 select-none">
      
      {/* Exquisite responsive background radial glow */}
      <div 
        className="absolute inset-0 -z-10 h-full w-full opacity-[0.02] dark:opacity-[0.03] pointer-events-none transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: isArchived 
            ? 'radial-gradient(circle at center, rgba(245, 158, 11, 0.15) 0%, transparent 65%)'
            : 'radial-gradient(circle at center, rgba(239, 68, 68, 0.12) 0%, transparent 65%)',
        }}
      />

      {/* Header Panel */}
      <div className="flex flex-col space-y-1.5 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-red-500 dark:text-red-400" />
          <span>Danger Zone</span>
        </h2>
        <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
          Perform critical, irreversible actions on the organization <strong className="text-foreground font-medium">{orgName}</strong>. 
          Please exercise extreme caution when triggering these workflows.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Card 1: Archiving */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "group rounded-2xl border bg-zinc-500/5 dark:bg-zinc-900/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-300",
            isArchived 
              ? "border-amber-500/30 hover:border-amber-500/50 bg-amber-500/[0.01]" 
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
          )}
        >
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Archive className={cn("w-4 h-4", isArchived ? "text-amber-500" : "text-muted-foreground")} />
              <span>{isArchived ? "Restore Organization" : "Archive this organization"}</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isArchived 
                ? "Restoring this organization will lift the read-only constraint, permitting full write and modify permissions to authorized developers."
                : "Archiving puts the organization in a strict read-only state. You can still inspect repositories, schemas, and credentials, but all creations or modifications are locked."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowArchiveAlert(true)}
            className={cn(
              "w-full sm:w-auto shrink-0 rounded-full px-5 py-1.5 text-xs font-medium tracking-wide uppercase transition-all duration-350",
              isArchived 
                ? "border-amber-500/30 text-amber-600 hover:text-amber-500 hover:bg-amber-500/10" 
                : "border-zinc-250 dark:border-zinc-700 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
            )}
          >
            {isArchived ? "Restore Org" : "Archive Org"}
          </Button>
        </motion.div>

        {/* Card 2: Deletion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="group rounded-2xl border border-red-500/20 bg-red-500/[0.01] hover:border-red-500/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-300"
        >
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-sm font-semibold tracking-tight text-red-500 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Delete this organization</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently purge the organization <strong className="text-foreground font-medium">{orgName}</strong>, removing members, roles, billing profiles, custom libraries, assessment histories, and general access rules. This action is completely irreversible.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              setDeleteConfirmText("");
              setShowDeleteDialog(true);
            }}
            className="w-full sm:w-auto shrink-0 rounded-full px-5 py-1.5 text-xs font-semibold tracking-wide uppercase bg-red-600 text-white hover:bg-red-500 dark:bg-red-950/40 dark:text-red-400 dark:border dark:border-red-500/30 dark:hover:bg-red-900/30 transition-all duration-350"
          >
            Delete Org
          </Button>
        </motion.div>

      </div>

      {/* --- Archive / Restore Confirmation Overlay --- */}
      <AlertDialog open={showArchiveAlert} onOpenChange={setShowArchiveAlert}>
        <AlertDialogContent className="rounded-2xl max-w-md border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              {isArchived ? (
                <>
                  <RefreshCcw className="w-4 h-4 text-violet-500" />
                  <span>Confirm Restore?</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Archive Organization?</span>
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
              {isArchived 
                ? `This will restore full read/write operations for "${orgName}". Authorized members can once again create problem schemas, issue invitations, and update ACL general rules.`
                : `Are you sure you want to archive "${orgName}"? This suspends all write permissions across Heapdog's workspaces, converting this space into a read-only archive.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-full text-xs px-5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleArchiveToggle}
              disabled={isArchiving}
              className={cn(
                "rounded-full text-xs px-5 min-w-[110px]",
                isArchived 
                  ? "bg-violet-600 text-white hover:bg-violet-500" 
                  : "bg-amber-500 text-black hover:bg-amber-400 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-500"
              )}
            >
              {isArchiving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isArchived ? (
                "Restore"
              ) : (
                "Archive"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Delete Confirmation Dialog Modal --- */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl max-w-md border-red-500/25 bg-background select-none">
          <DialogHeader className="space-y-2.5">
            <DialogTitle className="text-sm font-bold text-red-500 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5" />
              <span>Absolute Purge Warning</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground space-y-2">
              <p>
                This operation is highly destructive and irreversible. You are about to permanently delete the entire workspace history for:
              </p>
              <div className="bg-red-500/[0.03] border border-red-500/15 rounded-lg px-3 py-2 text-center text-foreground font-mono text-xs select-text">
                {orgName}
              </div>
              <p>
                To confirm this action, please type the exact organization name in the text field below:
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="my-2.5">
            <Input
              type="text"
              placeholder={orgName}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="text-xs rounded-xl h-10 border-zinc-250 dark:border-zinc-800 focus:ring-red-500/40 focus:border-red-500/50 bg-zinc-500/5 font-medium placeholder:text-muted-foreground/50 tracking-wide"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="rounded-full text-xs px-5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleteConfirmText !== orgName || isDeleting}
              onClick={handleDeleteSubmit}
              className={cn(
                "rounded-full text-xs px-5 min-w-[120px] transition-all duration-200",
                deleteConfirmText === orgName
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-red-500/20 text-red-400/50 border border-red-500/10 cursor-not-allowed"
              )}
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Confirm Purge"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
