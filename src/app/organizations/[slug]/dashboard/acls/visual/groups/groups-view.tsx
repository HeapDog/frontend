"use client"

import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Users, 
  Plus,
  MoreHorizontal,
  X,
  Search,
  Loader2,
  Trash2,
  ShieldAlert,
  FolderKanban,
  Check,
  ChevronRight,
  ShieldCheck,
  User
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Member {
  name: string;
  email: string;
  initials: string;
  pictureUrl?: string | null;
}

interface Group {
  name: string;
  type: string;
  description: string;
  size: number;
  members: Member[];
}

interface GroupsViewProps {
  groups: Group[];
}

export function GroupsView({ groups }: GroupsViewProps) {
  const router = useRouter();
  const [groupsList, setGroupsList] = useState<Group[]>(groups);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const { check } = useMyPermissions(slug);
  const canWrite = check("acl:write");

  // Keep state in sync with props
  useEffect(() => {
    setGroupsList(groups);
  }, [groups]);

  // Deletion States
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      // 1. Fetch raw ACL policy
      const res = await fetch(`/api/organizations/${slug}/acl`);
      if (!res.ok) {
        throw new Error("Failed to retrieve current Access Control List.");
      }
      const data = await res.json();
      
      const acl = data?.data?.acl || data?.acl || data;
      if (!acl || !acl.groups) {
        throw new Error("Invalid access policy structure fetched.");
      }

      // 2. Check if group is referenced in active access rules
      const nakedTarget = deleteTarget.startsWith("group:") ? deleteTarget.substring(6) : deleteTarget;
      const prefixedTarget = deleteTarget.startsWith("group:") ? deleteTarget : `group:${deleteTarget}`;

      const isReferencedInGrants = (acl.grants || []).some((rule: any) => 
        rule.who.includes(nakedTarget) || rule.who.includes(prefixedTarget)
      );
      const isReferencedInDenies = (acl.denies || []).some((rule: any) => 
        rule.who.includes(nakedTarget) || rule.who.includes(prefixedTarget)
      );

      if (isReferencedInGrants || isReferencedInDenies) {
        throw new Error("Groups currently referenced by active access rules cannot be deleted.");
      }

      // 3. Delete group from policy
      if (acl.groups[deleteTarget]) {
        delete acl.groups[deleteTarget];
      } else {
        const nakedName = deleteTarget.startsWith("group:") ? deleteTarget.substring(6) : deleteTarget;
        delete acl.groups[deleteTarget];
        delete acl.groups[nakedName];
      }

      // 4. PUT updated policy back to server
      const saveRes = await fetch(`/api/organizations/${slug}/acl`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acl),
      });

      const saveResult = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveResult.error || "Failed to update organization access policy.");
      }

      toast.success(`Group "${deleteTarget}" successfully deleted from policy!`);
      setDeleteTarget(null);
      setGroupsList((prev) => prev.filter((g) => g.name !== deleteTarget));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to complete group deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Group Creation States ---
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [membersPool, setMembersPool] = useState<Member[]>([]);
  const [membersPage, setMembersPage] = useState(1);
  const [membersTotalPages, setMembersTotalPages] = useState(1);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [membersSearch, setMembersSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const fetchMembers = useCallback(async (page: number, search: string, isInitial: boolean) => {
    setIsMembersLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: "15",
      });
      const res = await fetch(`/api/organizations/${slug}/memberships?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      
      const newMembers: Member[] = (result.contents || []).map((m: any) => {
        const name = `${m.firstName} ${m.lastName}`.trim() || m.username;
        return {
          name,
          email: m.email || "",
          initials: getInitials(name)
        };
      });

      setMembersPool((prev) => isInitial ? newMembers : [...prev, ...newMembers]);
      setMembersTotalPages(result.meta?.totalPages || 1);
      setMembersPage(page);
    } catch (err) {
      toast.error("Failed to load organization members");
    } finally {
      setIsMembersLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (isCreateDialogOpen) {
      setNewGroupName("");
      setSelectedMembers([]);
      setMembersSearch("");
      setMembersPool([]);
      fetchMembers(1, "", true);
    }
  }, [isCreateDialogOpen, fetchMembers]);

  const filteredMembers = useMemo(() => {
    if (!membersSearch.trim()) return membersPool;
    const q = membersSearch.toLowerCase();
    return membersPool.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [membersPool, membersSearch]);

  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 30) {
      if (membersPage < membersTotalPages && !isMembersLoading) {
        fetchMembers(membersPage + 1, membersSearch, false);
      }
    }
  };

  const toggleMemberSelection = (member: Member) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.email === member.email);
      if (exists) {
        return prev.filter((m) => m.email !== member.email);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleCreateGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      toast.error("Group name is required");
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      toast.error("Group name must only contain letters, numbers, hyphens, or underscores");
      return;
    }



    const finalGroupName = trimmedName.startsWith("group:") ? trimmedName : `group:${trimmedName}`;

    // Check if group already exists
    const groupExists = groupsList.some((g) => g.name.toLowerCase() === finalGroupName.toLowerCase());
    if (groupExists) {
      toast.error(`Group "${finalGroupName}" already exists`);
      return;
    }

    setIsCreating(true);

    try {
      // 1. Fetch raw ACL
      const res = await fetch(`/api/organizations/${slug}/acl`);
      if (!res.ok) {
        throw new Error("Failed to retrieve current Access Control List.");
      }
      const data = await res.json();
      
      const acl = data?.data?.acl || data?.acl || data;
      const usersDict = (data?.data?.users || data?.users || {}) as Record<string, any>;
      if (!acl || !acl.groups) {
        throw new Error("Invalid access policy structure fetched.");
      }

      // 2. Map selected members emails to uuid values
      const memberUuids = selectedMembers.map((member) => {
        const matchedUser = Object.values(usersDict).find(
          (u: any) => u.email?.toLowerCase() === member.email.toLowerCase()
        ) as any;
        if (matchedUser) {
          return `uuid:${matchedUser.id}`;
        }
        return `email:${member.email}`;
      });

      // 3. Save group under acl.groups
      if (!acl.groups) acl.groups = {};
      acl.groups[finalGroupName] = memberUuids;

      // 4. PUT updated policy back to server
      const saveRes = await fetch(`/api/organizations/${slug}/acl`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acl),
      });

      const saveResult = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveResult.error || "Failed to update organizational groups policy.");
      }

      toast.success(`Group "${finalGroupName}" successfully created and saved!`);
      
      // Update local state
      const newGroup: Group = {
        name: finalGroupName,
        type: "Custom Group",
        description: "Custom identity group mapping roles and permissions inside the organization.",
        size: selectedMembers.length,
        members: selectedMembers,
      };

      setGroupsList((prev) => [...prev, newGroup]);
      setIsCreateDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create group.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl relative z-10">
      
      {/* Table Action Header Block */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/10 select-none">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
            Organization Identity
          </span>
          <h2 className="text-sm font-bold tracking-tight text-foreground/90 leading-none mt-1">
            Visual Role Mappings ({groupsList.length})
          </h2>
        </div>
        {canWrite && (
          <Button
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-1.5 h-8 bg-primary hover:bg-primary/95 text-white text-xs font-semibold shrink-0 rounded-xl cursor-pointer shadow-sm shadow-primary/10 transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Group
          </Button>
        )}
      </div>

      {/* Modern elevated visual groups list */}
      {groupsList.length > 0 ? (
        <div className="border border-border/30 rounded-2xl overflow-hidden bg-card/25 backdrop-blur-md shadow-sm transition-all duration-300">
          <Table containerClassName="overflow-x-hidden md:overflow-x-auto">
            <TableHeader className="bg-muted/30 select-none">
              <TableRow className="border-b border-border/20">
                <TableHead className="w-[280px] font-bold text-foreground/80 text-xs py-3.5">Group Identifier</TableHead>
                <TableHead className="w-[110px] font-bold text-foreground/80 text-xs text-center py-3.5">Size</TableHead>
                <TableHead className="font-bold text-foreground/80 text-xs py-3.5">Assigned Members</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {groupsList.map((group, index) => {
                  const isAutogroup = group.name.startsWith("autogroup:");
                  return (
                    <MotionTableRow 
                      key={group.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 450, damping: 30, delay: index * 0.04 }}
                      className="hover:bg-muted/[0.08] transition-colors border-b border-border/10 group/row"
                    >
                      <TableCell className="align-middle py-3.5">
                        <div className="flex items-center gap-2">
                          <FolderKanban className={cn("h-4 w-4 shrink-0", isAutogroup ? "text-primary/70" : "text-muted-foreground/80")} />
                          <span className={cn(
                            "font-mono text-xs font-bold px-2 py-0.5 rounded-md border select-all transition-all duration-200",
                            isAutogroup 
                              ? "bg-primary/[0.04] text-primary border-primary/20 dark:border-primary/20"
                              : "bg-muted text-foreground/80 border-border/40"
                          )}>
                            {group.name}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Size segment */}
                      <TableCell className="align-middle py-3.5 text-center select-none">
                        <span className="inline-flex items-center justify-center font-bold text-xs bg-muted/65 border border-border/20 px-2 py-0.5 rounded-lg min-w-[28px] text-foreground/85">
                          {group.size}
                        </span>
                      </TableCell>
                      
                      {/* Member pile & Actions segment */}
                      <TableCell className="align-middle py-3.5">
                        <div className="flex items-center justify-between gap-4">
                          
                          {/* Avatars heap */}
                          <div 
                            className="flex items-center -space-x-1.5 cursor-pointer py-1 select-none"
                            onClick={() => setSelectedGroup(group)}
                            title="Open members list"
                          >
                            {group.members.slice(0, 4).map((member, i) => (
                              <div
                                key={member.email}
                                title={`${member.name} (${member.email})`}
                                className={cn(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold uppercase ring-2 ring-background border select-none shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:z-25 overflow-hidden",
                                  member.pictureUrl 
                                    ? "border-border/5" 
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60"
                                )}
                              >
                                {member.pictureUrl ? (
                                  <img
                                    src={member.pictureUrl}
                                    alt={member.name}
                                    className="h-full w-full object-cover select-none"
                                  />
                                ) : (
                                  <User className="h-[55%] w-[55%]" />
                                )}
                              </div>
                            ))}
                            {group.members.length > 4 && (
                              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-extrabold ring-2 ring-background border border-border/5 text-muted-foreground select-none">
                                +{group.members.length - 4}
                              </div>
                            )}
                          </div>

                          {/* Quick Actions pile */}
                          <div className="flex items-center gap-1.5 opacity-60 group-hover/row:opacity-100 transition-opacity select-none pr-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              onClick={() => setSelectedGroup(group)}
                              title="View members"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>

                            {/* Delete button for custom groups */}
                            {canWrite && !isAutogroup && (
                              <Button
                                variant="ghost"
                                type="button"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(group.name);
                                }}
                                className="h-7 w-7 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors duration-150"
                                title="Delete Group"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                        </div>
                      </TableCell>
                    </MotionTableRow>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Elevated Empty State Card */
        <div className="border border-dashed border-border/40 p-12 rounded-2xl bg-card/25 backdrop-blur-md flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-4 select-none">
          <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/20 text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground/90">No Groups Found</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-normal">
              No systemic autogroups or custom role policies are configured. Create a new custom group to get started.
            </p>
          </div>
          {canWrite && (
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-8 text-xs font-semibold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-sm cursor-pointer shadow-primary/10"
            >
              Create First Group
            </Button>
          )}
        </div>
      )}

      {/* Modern Dialog Roster Modal */}
      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <DialogContent className="max-w-xl bg-card/95 border border-border/40 shadow-2xl rounded-2xl backdrop-blur-lg">
          <DialogHeader className="select-none pb-2 border-b border-border/10">
            <DialogTitle className="flex items-center gap-2 font-mono text-xs font-bold text-foreground/90">
              <Users className="h-4.5 w-4.5 text-primary shrink-0" />
              <span className={cn(
                "px-2 py-0.5 rounded-md border select-all font-mono text-xs",
                selectedGroup?.name.startsWith("autogroup:")
                  ? "bg-primary/[0.04] text-primary border-primary/20"
                  : "bg-muted text-foreground/90 border-border/40"
              )}>
                {selectedGroup?.name}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-normal">
              Resolved user accounts and identities active under this group boundary.
            </DialogDescription>
          </DialogHeader>

          {/* Roster Listing */}
          <div className="mt-1 border border-border/20 rounded-xl overflow-hidden bg-background/35 max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/40 select-none border-b border-border/15">
                <TableRow>
                  <TableHead className="w-[50px] font-bold text-foreground/80 text-xs py-2">Profile</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-xs py-2">Full Name</TableHead>
                  <TableHead className="font-bold text-foreground/80 text-xs py-2">Email Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedGroup?.members.map((member, i) => (
                  <TableRow key={member.email} className="hover:bg-muted/[0.05] transition-colors border-b border-border/10">
                    <TableCell className="py-2.5">
                      <div
                        className={cn(
                          "inline-flex h-6.5 w-6.5 items-center justify-center rounded-full text-xs font-bold uppercase select-none shadow-sm border overflow-hidden",
                          member.pictureUrl
                            ? "border-border/5"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60"
                        )}
                      >
                        {member.pictureUrl ? (
                          <img
                            src={member.pictureUrl}
                            alt={member.name}
                            className="h-full w-full object-cover select-none"
                          />
                        ) : (
                          <User className="h-[55%] w-[55%]" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground/90 text-xs py-2.5 font-sans">
                      {member.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground select-all py-2.5">
                      {member.email === "dynamically-resolved" ? "Dynamic resolved accounts" : member.email}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Creation Dialog (Modern and compact) */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 border-border/40 text-foreground font-sans rounded-2xl shadow-2xl backdrop-blur-lg">
          <DialogHeader className="select-none border-b border-border/10 pb-3">
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Users className="h-4.5 w-4.5 text-violet-500" />
              Create Custom Group
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a logical team boundary mapping roles and members inside the organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4.5 py-2.5 text-xs">
            {/* Group Name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center justify-between select-none">
                <span>Group Identifier</span>
                <AnimatePresence>
                  {newGroupName.trim() && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="font-mono text-xs text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.2 h-4.5 rounded-md flex items-center select-none"
                    >
                      group:{newGroupName.trim().toLowerCase()}
                    </motion.span>
                  )}
                </AnimatePresence>
              </label>
              <Input
                placeholder="e.g. engineering-leads"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value.replace(/\s+/g, ""))}
                className="font-mono text-xs h-9 focus-visible:ring-1 focus-visible:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground/60 leading-normal select-none">
                Spaces are stripped automatically. Bound in rules as{" "}
                <code className="text-violet-600 dark:text-violet-400 font-semibold font-mono text-xs">
                  group:{newGroupName.trim().toLowerCase() || "name"}
                </code>.
              </p>
            </div>

            {/* Select Members Selector */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase select-none">
                Assign Members
              </label>
              
              {/* Trigger Input Area */}
              <div
                onClick={() => setIsDropdownOpen((v) => !v)}
                className={cn(
                  "border border-border/50 bg-background/50 hover:bg-background/80 px-3 py-2 flex flex-wrap gap-1.5 items-center justify-between cursor-pointer min-h-9 rounded-xl transition-all duration-150 focus-within:ring-1 focus-within:ring-violet-500/20",
                  isDropdownOpen && "border-violet-500/50 ring-1 ring-violet-500/25 bg-background/90"
                )}
              >
                {selectedMembers.length === 0 ? (
                  <span className="text-xs text-muted-foreground/60 select-none">Select organization members...</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-w-[90%] pointer-events-auto">
                    <AnimatePresence>
                      {selectedMembers.map((m) => (
                        <motion.span
                          key={m.email}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                          className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-md text-xs font-bold font-sans"
                        >
                          {m.name}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemberSelection(m);
                            }}
                            className="text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-200 transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
                <Plus className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </div>

              {/* Dismiss Click Shield */}
              {isDropdownOpen && (
                <div
                  className="fixed inset-0 z-40 bg-transparent cursor-default"
                  onClick={() => setIsDropdownOpen(false)}
                />
              )}

              {/* Autocomplete Dropdown Panel */}
              {isDropdownOpen && (
                <div className="absolute top-[105%] left-0 right-0 z-50 bg-popover text-popover-foreground border border-border/40 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-56">
                  {/* Search filter input */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/40 shrink-0 select-none">
                    <Search className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={membersSearch}
                      onChange={(e) => setMembersSearch(e.target.value)}
                      className="bg-transparent border-0 outline-none text-xs w-full focus:ring-0 placeholder:text-muted-foreground/40 p-0 font-sans"
                    />
                  </div>

                  {/* List Box */}
                  <div
                    className="overflow-y-auto py-1 divide-y divide-border/10 flex-1 min-h-0"
                    onScroll={handleDropdownScroll}
                  >
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((m) => {
                        const isSelected = selectedMembers.some((sm) => sm.email === m.email);
                        return (
                          <div
                            key={m.email}
                            onClick={() => toggleMemberSelection(m)}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 cursor-pointer transition-colors text-xs select-none"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleMemberSelection(m)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-3.5 w-3.5 border-border/60 rounded cursor-pointer"
                            />
                            <div className="flex flex-col min-w-0 font-sans">
                              <span className="font-bold text-foreground truncate">{m.name}</span>
                              <span className="text-xs text-muted-foreground/60 truncate">{m.email}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground/50 italic font-sans select-none">
                        {isMembersLoading ? "Loading members..." : "No members found"}
                      </div>
                    )}

                    {/* Loader node */}
                    {isMembersLoading && (
                      <div className="flex items-center justify-center gap-1.5 py-2.5 border-t border-border/10 bg-muted/5 select-none">
                        <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                        <span className="text-xs text-muted-foreground font-sans">Loading member pool...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border/20 pt-4.5 select-none w-full">
            <DialogClose asChild>
              <Button 
                variant="outline" 
                disabled={isCreating} 
                className="h-9.5 text-xs font-bold rounded-xl border border-border/40 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer w-full"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleCreateGroup}
              disabled={isCreating || !newGroupName.trim()}
              className={cn(
                "h-9.5 text-xs font-bold text-white shadow-md gap-1.5 rounded-xl cursor-pointer transition-all duration-200 w-full",
                !newGroupName.trim()
                  ? "bg-muted text-muted-foreground cursor-not-allowed border-transparent shadow-none"
                  : "bg-primary hover:bg-primary/90 shadow-primary/10"
              )}
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Deletion Confirmation Alert Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-zinc-950 border border-zinc-900 text-zinc-300 backdrop-blur-md rounded-2xl max-w-sm shadow-2xl">
          <AlertDialogHeader className="select-none">
            <AlertDialogTitle className="text-white flex items-center gap-2 text-sm font-bold">
              <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0" />
              Delete Custom Group?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs leading-normal pt-1.5">
              Are you sure you want to delete <code className="font-mono text-zinc-200 font-bold bg-zinc-900 border border-zinc-800/80 px-1 py-0.2 rounded-md">{deleteTarget}</code>?
              <span className="block mt-2 text-zinc-400 font-semibold border-t border-zinc-900 pt-2 text-xs">
                Groups currently referenced by active access rules cannot be deleted.
              </span>
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
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
