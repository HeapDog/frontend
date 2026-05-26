"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Info,
  History,
  ShieldAlert,
  Loader2,
  Trash2,
  Edit3,
  ShieldCheck,
  ShieldX,
  Users,
  Sparkles,
  ChevronRight,
  Shield,
  FolderKanban,
  User
} from "lucide-react";
import { useMyPermissions } from "@/hooks/use-my-permissions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { motion, AnimatePresence } from "framer-motion";

const MotionTableRow = motion(TableRow);

interface ApiUser {
  id: string;
  name: string;
  email: string;
  pictureUrl?: string | null;
}

interface AclRule {
  who: string[];
  permissions: string[];
}

interface GeneralAccessRulesViewProps {
  slug: string;
  grants: AclRule[];
  denies: AclRule[];
  users?: Record<string, ApiUser>;
}

export function GeneralAccessRulesView({ 
  slug, 
  grants = [], 
  denies = [], 
  users = {} 
}: GeneralAccessRulesViewProps) {
  const router = useRouter();
  const { check } = useMyPermissions(slug);
  const canWrite = check("acl:write");
  const hasRules = grants.length > 0 || denies.length > 0;

  // Deletion & Modal states
  const [deleteTarget, setDeleteTarget] = useState<{ type: "grant" | "deny"; index: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      // 1. Fetch raw ACL policy configuration
      const res = await fetch(`/api/organizations/${slug}/acl`);
      if (!res.ok) {
        throw new Error("Failed to retrieve current Access Control List.");
      }
      const data = await res.json();
      
      const acl = data?.data?.acl || data?.acl || data;
      if (!acl || (!acl.grants && !acl.denies)) {
        throw new Error("Invalid access policy structure fetched.");
      }

      // 2. Remove rule from target array in place
      if (deleteTarget.type === "grant") {
        if (acl.grants && acl.grants[deleteTarget.index]) {
          acl.grants.splice(deleteTarget.index, 1);
        } else {
          throw new Error("Target grant rule index not found in policy.");
        }
      } else {
        if (acl.denies && acl.denies[deleteTarget.index]) {
          acl.denies.splice(deleteTarget.index, 1);
        } else {
          throw new Error("Target deny rule index not found in policy.");
        }
      }

      // 3. PUT the updated policy back to server
      const saveRes = await fetch(`/api/organizations/${slug}/acl`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acl),
      });

      const saveResult = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveResult.error || "Failed to update organization access policy.");
      }

      toast.success("Access rule successfully deleted from policy!");
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to complete access rule deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Build mapping from email to user profiles
  const emailToUserMap: Record<string, { name: string; email: string; initials: string; pictureUrl?: string | null }> = {};
  
  for (const user of Object.values(users)) {
    if (user.email) {
      const emailLower = user.email.toLowerCase();
      const initials = (() => {
        const parts = (user.name || "").trim().split(/\s+/);
        if (parts.length === 1 && parts[0]) {
          return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
        }
        if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return "?";
      })();

      emailToUserMap[emailLower] = {
        name: user.name || "Active Member",
        email: user.email,
        initials,
        pictureUrl: user.pictureUrl || null
      };
    }
  }

  // Fallback offline mock profiles
  const mockDeveloperProfiles = [
    { name: "Partho Kumar Rajvor", email: "partho.kr@proton.me", initials: "PK" },
    { name: "Developer Alpha", email: "dev1@heapdog.io", initials: "DA" },
    { name: "Developer Beta", email: "dev2@heapdog.io", initials: "DB" },
    { name: "Reviewer One", email: "reviewer1@heapdog.io", initials: "R1" },
    { name: "Reviewer Two", email: "reviewer2@heapdog.io", initials: "R2" },
    { name: "Guest Coder", email: "external-guest@partner.com", initials: "GC" },
    { name: "John Doe", email: "john.doe@heapdog.com", initials: "JD" },
    { name: "Finance Admin", email: "finance-admin@heapdog.io", initials: "FA" },
    { name: "SecOps Admin", email: "secops@heapdog.io", initials: "SA" }
  ];

  for (const profile of mockDeveloperProfiles) {
    const key = profile.email.toLowerCase();
    if (!emailToUserMap[key]) {
      emailToUserMap[key] = profile;
    }
  }

  // Render individual grantees (Group tags, autogroups, or user email capsules with hovercards)
  const renderGrantee = (whoItem: string) => {
    if (whoItem.startsWith("email:")) {
      const email = whoItem.substring(6);
      const user = emailToUserMap[email.toLowerCase()] || { 
        name: "Organization Member", 
        email, 
        initials: "OM",
        pictureUrl: null as string | null
      };

      return (
        <div 
          key={whoItem} 
          className="relative group cursor-help select-none shrink-0"
        >
          {/* User Email Capsule Pill */}
          <span className="font-mono text-xs font-bold px-2 py-0.5 border rounded-lg select-all leading-none bg-violet-500/[0.04] text-violet-600 dark:text-violet-400 border-violet-500/25 flex items-center gap-1.5 transition-all hover:bg-violet-500/10">
            {user.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.name}
                className="h-3.5 w-3.5 rounded-full select-none shrink-0 object-cover"
              />
            ) : (
              <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 select-none shrink-0 border border-zinc-300 dark:border-zinc-700/60">
                <User className="h-[60%] w-[60%]" />
              </span>
            )}
            {email}
          </span>
          
          {/* Premium Hover Card Popover */}
          <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 mb-2 w-44 p-3 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 transform scale-95 origin-bottom group-hover:scale-100 flex flex-col items-center text-center space-y-1.5 select-none">
            {user.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.name}
                className="h-7 w-7 rounded-full select-none shrink-0 object-cover border border-violet-500/35"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shadow-sm shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
            <div className="space-y-0.5">
              <span className="block text-white text-xs font-bold leading-none truncate max-w-[150px]">{user.name}</span>
              <span className="block text-zinc-500 font-mono text-[10px] truncate max-w-[150px] select-all leading-none mt-1">{user.email}</span>
            </div>
          </div>
        </div>
      );
    }

    const isAutogroup = whoItem.startsWith("autogroup:");
    
    return (
      <span 
        key={whoItem}
        className={cn(
          "font-mono text-xs font-bold px-2 py-0.5 border rounded-lg select-all leading-none shrink-0 flex items-center gap-1.5",
          isAutogroup 
            ? "bg-indigo-500/[0.04] text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
            : "bg-muted text-foreground/80 border-border/40"
        )}
      >
        {isAutogroup ? (
          <FolderKanban className="h-3.5 w-3.5 text-indigo-500/70 dark:text-indigo-400/80 shrink-0" />
        ) : (
          <FolderKanban className="h-3.5 w-3.5 text-muted-foreground/70 dark:text-muted-foreground/80 shrink-0" />
        )}
        {whoItem}
      </span>
    );
  };

  // Render permission paths cleanly as unified idiomatic code tags
  const renderPermissionPath = (p: string, isDeny = false) => {
    const isWildcard = p === "*";
    return (
      <Badge 
        key={p} 
        variant="outline" 
        className={cn(
          "font-mono text-xs tracking-wide py-0.5 px-2 rounded-lg border shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-all transition-colors duration-200 leading-none h-5.5 flex items-center shrink-0",
          isWildcard 
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-bold" 
            : isDeny
              ? "bg-red-500/[0.04] text-red-600 dark:text-red-400 border-red-500/20"
              : "bg-emerald-500/[0.04] text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        )}
      >
        {isWildcard ? "* (Full Access)" : p}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl relative z-10">
      
      {/* Header top Actions bar */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/10 select-none">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
            Access Rules
          </span>
          <h2 className="text-sm font-bold tracking-tight text-foreground/90 leading-none mt-1">
            General Policies
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-semibold rounded-xl cursor-pointer">
            <History className="h-3.5 w-3.5" />
            View History
          </Button>
          {canWrite && (
            <Link href={`/organizations/${slug}/dashboard/acls/visual/general-access-rules/add`}>
              <Button size="sm" className="gap-1.5 h-8 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm shadow-primary/10">
                <Plus className="h-3.5 w-3.5" />
                Add Rule
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Overflow visible container to allow grantee profile popovers to overlap without getting clipped */}
      <div className="border border-border/30 rounded-2xl overflow-visible bg-card/25 backdrop-blur-md shadow-sm transition-all duration-300">
        {hasRules ? (
          <Table className="overflow-visible" containerClassName="overflow-x-hidden md:overflow-x-auto">
            <TableHeader className="bg-muted/30 select-none border-b border-border/15">
              <TableRow>
                <TableHead className="w-[110px] font-bold text-foreground/80 text-xs py-3.5">Type</TableHead>
                <TableHead className="w-[250px] font-bold text-foreground/80 text-xs py-3.5">Who (Grantee)</TableHead>
                <TableHead className="font-bold text-foreground/80 text-xs py-3.5">Permissions</TableHead>
                {canWrite && <TableHead className="w-[140px] text-right font-bold text-foreground/80 text-xs py-3.5">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-visible">
              <AnimatePresence>
                {/* 1. Allows (Grants) mapping */}
                {grants.map((rule, idx) => (
                  <MotionTableRow 
                    key={`grant-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 30, delay: idx * 0.03 }}
                    className="hover:bg-muted/[0.08] transition-colors border-b border-border/10 group/row overflow-visible"
                  >
                    <TableCell className="align-middle py-4 select-none">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Allow</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle py-4 overflow-visible">
                      <div className="flex flex-wrap gap-1.5 w-full">
                        {rule.who.map(renderGrantee)}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle py-4">
                      <div className="flex flex-wrap gap-2 w-full">
                        {rule.permissions.map((p) => renderPermissionPath(p, false))}
                      </div>
                    </TableCell>
                    {canWrite && (
                      <TableCell className="align-middle py-4 text-right select-none">
                        <div className="flex justify-end gap-1.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                          <Link href={`/organizations/${slug}/dashboard/acls/visual/general-access-rules/edit?type=grant&index=${idx}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              title="Edit Rule"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget({ type: "grant", index: idx })}
                            className="h-7 w-7 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </MotionTableRow>
                ))}

                {/* 2. Denies mapping */}
                {denies.map((rule, idx) => (
                  <MotionTableRow 
                    key={`deny-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 30, delay: (grants.length + idx) * 0.03 }}
                    className="hover:bg-muted/[0.08] transition-colors border-b border-border/10 group/row overflow-visible"
                  >
                    <TableCell className="align-middle py-4 select-none">
                      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs">
                        <ShieldX className="h-4 w-4" />
                        <span>Deny</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle py-4 overflow-visible">
                      <div className="flex flex-wrap gap-1.5 w-full">
                        {rule.who.map(renderGrantee)}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle py-4">
                      <div className="flex flex-wrap gap-2 w-full">
                        {rule.permissions.map((p) => renderPermissionPath(p, true))}
                      </div>
                    </TableCell>
                    {canWrite && (
                      <TableCell className="align-middle py-4 text-right select-none">
                        <div className="flex justify-end gap-1.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                          <Link href={`/organizations/${slug}/dashboard/acls/visual/general-access-rules/edit?type=deny&index=${idx}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              title="Edit Rule"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget({ type: "deny", index: idx })}
                            className="h-7 w-7 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </MotionTableRow>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        ) : (
          /* Staged empty state */
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card/10 rounded-2xl space-y-4 select-none border border-dashed border-border/30">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground border border-border/20">
              <Shield className="h-5.5 w-5.5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground/90 leading-none">No Access Rules Configured</h3>
              <p className="text-xs text-muted-foreground/60 max-w-[280px] leading-relaxed pt-1">
                No custom Allow or Deny policy maps have been set up for this organization yet.
              </p>
            </div>
            {canWrite && (
              <Link href={`/organizations/${slug}/dashboard/acls/visual/general-access-rules/add`}>
                <Button size="sm" className="h-8 bg-primary hover:bg-primary/95 text-white text-xs font-semibold gap-1.5 rounded-xl cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  Create First Rule
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Whitelist Precedence consolidated notification block */}
      <div className="bg-card/30 border border-border/40 p-4.5 rounded-2xl flex gap-3.5 text-xs leading-relaxed text-muted-foreground select-none shadow-sm">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-foreground/90 block leading-tight">Policy Precedence: Deny Rules Dominate</span>
          <p className="opacity-80">
            Deny policies execute absolute hierarchy over grant white-lists. If a grantee matches a pattern in any active Deny rule, access will be locked instantly, completely overriding Allow directives.
          </p>
        </div>
      </div>
 
      {/* Premium Deletion Confirmation Modal */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-zinc-950 border border-zinc-900 text-zinc-300 backdrop-blur-md rounded-2xl max-w-sm shadow-2xl">
          <AlertDialogHeader className="select-none">
            <AlertDialogTitle className="text-white flex items-center gap-2 text-sm font-bold">
              <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0 animate-pulse" />
              Delete Access Rule?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs leading-normal pt-1.5">
              Are you sure you want to permanently delete this <span className="font-bold text-zinc-200">{deleteTarget?.type === "grant" ? "Allow" : "Deny"}</span> rule from the active policy? This will take effect immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="select-none pt-2">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="bg-transparent border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-900 h-8 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white font-bold h-8 text-xs gap-1.5 rounded-xl cursor-pointer"
            >
              {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
