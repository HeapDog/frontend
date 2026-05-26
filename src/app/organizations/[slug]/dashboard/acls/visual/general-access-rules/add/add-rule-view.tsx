"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal,
  Check,
  AlertCircle,
  HelpCircle,
  X,
  Plus,
  Info,
  Loader2,
  Users2,
  Sparkles,
  Mail,
  Copy,
  FolderLock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

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

interface AclConfig {
  groups: Record<string, string[]>;
  grants: AclRule[];
  denies: AclRule[];
}

interface ResourceRule {
  actions: string[];
  acceptsSelector: boolean;
}

interface AclMetadata {
  resources: string[];
  actions: string[];
  autogroups: string[];
  customGroups: string[];
  resourceRules: Record<string, ResourceRule>;
}

interface AddRuleViewProps {
  slug: string;
  initialAcl: AclConfig;
  users: Record<string, ApiUser>;
  aclMetadata: AclMetadata;
  mode?: "add" | "edit";
  ruleIndex?: number;
  ruleType?: "grant" | "deny";
}

export function AddRuleView({ 
  slug, 
  initialAcl, 
  users = {}, 
  aclMetadata,
  mode = "add",
  ruleIndex,
  ruleType: editRuleType
}: AddRuleViewProps) {
  const router = useRouter();

  // Extract lists
  const availableGroups = aclMetadata.customGroups || [];
  const availableAutogroups = aclMetadata.autogroups || [];
  const availableResources = aclMetadata.resources || [];
  
  // Load target rule if editing
  const editingRule = useMemo(() => {
    if (mode === "edit" && ruleIndex !== undefined && editRuleType) {
      const list = editRuleType === "grant" ? initialAcl.grants : initialAcl.denies;
      if (list && list[ruleIndex]) {
        return list[ruleIndex];
      }
    }
    return null;
  }, [mode, ruleIndex, editRuleType, initialAcl]);

  // Coordinate tracking for premium background glow
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // State variables
  const [whoType, setWhoType] = useState<"group" | "autogroup" | "user" | null>(() => {
    if (editingRule && editingRule.who.length > 0) {
      const first = editingRule.who[0];
      if (first.startsWith("autogroup:")) return "autogroup";
      if (first.startsWith("uuid:") || first.startsWith("email:")) return "user";
      return "group";
    }
    return null;
  });
  
  // Selected lists
  const [selectedGroups, setSelectedGroups] = useState<string[]>(() => {
    if (editingRule && editingRule.who.length > 0) {
      const first = editingRule.who[0];
      if (!first.startsWith("autogroup:") && !first.startsWith("uuid:") && !first.startsWith("email:")) {
        return editingRule.who;
      }
    }
    return [];
  });
  
  const [selectedAutogroups, setSelectedAutogroups] = useState<string[]>(() => {
    if (editingRule && editingRule.who.length > 0) {
      const first = editingRule.who[0];
      if (first.startsWith("autogroup:")) {
        return editingRule.who;
      }
    }
    return [];
  });

  const [userEmails, setUserEmails] = useState<string[]>(() => {
    if (editingRule && editingRule.who.length > 0) {
      const first = editingRule.who[0];
      if (first.startsWith("uuid:") || first.startsWith("email:")) {
        return editingRule.who.map((whoItem) => {
          if (whoItem.startsWith("uuid:")) {
            const id = whoItem.substring(5);
            const matchedUser = users[id];
            if (matchedUser && matchedUser.email) {
              return matchedUser.email;
            }
          }
          if (whoItem.startsWith("email:")) {
            return whoItem.substring(6);
          }
          return whoItem;
        });
      }
    }
    return [];
  });

  const [emailInput, setEmailInput] = useState("");
  const [ruleType, setRuleType] = useState<"grant" | "deny">(() => {
    if (mode === "edit" && editRuleType) {
      return editRuleType;
    }
    return "grant";
  });
  
  // Resource & Action
  const [resource, setResource] = useState("");
  
  const currentResourceRule = resource ? aclMetadata.resourceRules[resource] : undefined;
  const availableActions = currentResourceRule?.actions || [];
  
  const [action, setAction] = useState("");

  // Scoped selector
  const acceptsSelector = currentResourceRule?.acceptsSelector ?? false;
  const [selectorType, setSelectorType] = useState<"global" | "specific">("global");
  const [selectorValue, setSelectorValue] = useState("");

  // Force global scope if current resource doesn't support selector
  useEffect(() => {
    if (!acceptsSelector) {
      setSelectorType("global");
      setSelectorValue("");
    }
  }, [acceptsSelector]);

  // Sync action when resource changes
  useEffect(() => {
    setAction("");
  }, [resource]);

  const [permissions, setPermissions] = useState<string[]>(() => {
    if (editingRule) {
      return editingRule.permissions;
    }
    return [];
  });

  // Email handlers
  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    if (!trimmed.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (userEmails.includes(trimmed)) {
      setEmailInput("");
      return;
    }
    setUserEmails([...userEmails, trimmed]);
    setEmailInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleRemoveEmail = (indexToRemove: number) => {
    setUserEmails(userEmails.filter((_, i) => i !== indexToRemove));
  };

  // Group handlers
  const handleAddGroup = (val: string) => {
    if (!val) return;
    if (selectedGroups.includes(val)) return;
    setSelectedGroups([...selectedGroups, val]);
  };

  const handleRemoveGroup = (groupToRemove: string) => {
    setSelectedGroups(selectedGroups.filter((g) => g !== groupToRemove));
  };

  // Autogroup handlers
  const handleAddAutogroup = (val: string) => {
    if (!val) return;
    if (selectedAutogroups.includes(val)) return;
    setSelectedAutogroups([...selectedAutogroups, val]);
  };

  const handleRemoveAutogroup = (autogroupToRemove: string) => {
    setSelectedAutogroups(selectedAutogroups.filter((ag) => ag !== autogroupToRemove));
  };

  // Compile full "who" selector
  const compiledWho = (() => {
    if (whoType === "group") {
      return selectedGroups;
    }
    if (whoType === "autogroup") {
      return selectedAutogroups;
    }
    if (whoType === "user") {
      return userEmails.map(email => email.startsWith("email:") ? email : `email:${email}`);
    }
    return [];
  })();

  // Compile formulated permission string (resource:action:selector)
  const currentPermission = (() => {
    if (!resource || !action) return "";
    const selectorPart = selectorType === "global" ? "" : selectorValue.trim() || "*";
    if (selectorPart) {
      return `${resource}:${action}:${selectorPart}`;
    }
    return `${resource}:${action}`;
  })();

  const handleAddPermission = () => {
    if (!resource || !action) {
      toast.error("Please select a resource and an action first.");
      return;
    }
    if (!permissions.includes(currentPermission)) {
      setPermissions([...permissions, currentPermission]);
      toast.success(`Formulated path added to ${ruleType === "grant" ? "allows" : "denies"}`);
    } else {
      toast.info("This permission path is already added to the list.");
    }
  };

  const handleRemovePermission = (indexToRemove: number) => {
    setPermissions(permissions.filter((_, i) => i !== indexToRemove));
  };

  // Construct JSON representation of the rule
  const ruleJson = useMemo(() => {
    const ruleObj: Record<string, any> = {};
    if (permissions.length > 0) {
      if (ruleType === "grant") {
        ruleObj.grants = [{
          who: compiledWho,
          permissions
        }];
      } else {
        ruleObj.denies = [{
          who: compiledWho,
          permissions
        }];
      }
    }
    return JSON.stringify(ruleObj, null, 2);
  }, [compiledWho, permissions, ruleType]);

  const handleReset = () => {
    setWhoType(null);
    setSelectedGroups([]);
    setSelectedAutogroups([]);
    setUserEmails([]);
    setEmailInput("");
    setRuleType("grant");
    setPermissions([]);
    setResource("");
    setAction("");
    setSelectorType("global");
    setSelectorValue("");
    toast.success("Form settings reset successfully");
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (permissions.length === 0) {
      toast.error("Please add at least one formulated permission path.");
      return;
    }

    setIsSaving(true);

    // Map emails back to UUID identifiers using backend users lookup
    const finalWho = compiledWho.map((item) => {
      if (item.startsWith("email:")) {
        const email = item.substring(6).toLowerCase();
        const matchedUser = Object.values(users).find(
          (u) => u.email?.toLowerCase() === email
        );
        if (matchedUser) {
          return `uuid:${matchedUser.id}`;
        }
      }
      return item;
    });

    const updatedAcl = JSON.parse(JSON.stringify(initialAcl));

    const newRule = {
      who: finalWho,
      permissions: permissions
    };

    if (mode === "edit" && ruleIndex !== undefined && editRuleType) {
      if (ruleType === editRuleType) {
        // Same type: replace in place
        if (ruleType === "grant") {
          updatedAcl.grants[ruleIndex] = newRule;
        } else {
          updatedAcl.denies[ruleIndex] = newRule;
        }
      } else {
        // Changed type: remove from old list and append to new list
        if (editRuleType === "grant") {
          updatedAcl.grants.splice(ruleIndex, 1);
        } else {
          updatedAcl.denies.splice(ruleIndex, 1);
        }

        if (ruleType === "grant") {
          if (!updatedAcl.grants) updatedAcl.grants = [];
          updatedAcl.grants.push(newRule);
        } else {
          if (!updatedAcl.denies) updatedAcl.denies = [];
          updatedAcl.denies.push(newRule);
        }
      }
    } else {
      // Standard Add mode: append
      if (ruleType === "grant") {
        if (!updatedAcl.grants) updatedAcl.grants = [];
        updatedAcl.grants.push(newRule);
      } else {
        if (!updatedAcl.denies) updatedAcl.denies = [];
        updatedAcl.denies.push(newRule);
      }
    }

    try {
      const response = await fetch(`/api/organizations/${slug}/acl`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAcl),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save organization policy");
      }

      toast.success(
        mode === "edit"
          ? "Access rule successfully updated and saved to policy!"
          : "Access rule successfully added and saved to policy!"
      );
      router.push(`/organizations/${slug}/dashboard/acls/visual/general-access-rules`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update access policy");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy-to-clipboard functionality
  const [copied, setCopied] = useState(false);
  const handleCopyJson = () => {
    if (!ruleJson || permissions.length === 0) {
      toast.info("No compiled rules to copy yet.");
      return;
    }
    navigator.clipboard.writeText(ruleJson);
    setCopied(true);
    toast.success("Rule JSON copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="space-y-6 relative min-h-screen pb-8 transition-all duration-300"
      style={{
        "--glow-color": ruleType === "grant" ? "16, 185, 129" : "239, 68, 68",
        "--x": `${coords.x}px`,
        "--y": `${coords.y}px`,
      } as React.CSSProperties}
    >
      {/* Background Radial Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(var(--glow-color),0.025),transparent_45%)] pointer-events-none transition-all duration-300 z-0" />

      {/* Compact Visual Top-Bar */}
      <div className="flex items-center gap-3 relative z-10 pb-3 border-b border-border/10 select-none">
        <Link 
          href={`/organizations/${slug}/dashboard/acls/visual/general-access-rules`}
          className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-border/40 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 group"
          title="Back to General Access Rules"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div className="flex flex-col">
          <h2 className="text-sm font-bold tracking-tight text-foreground/90 flex items-center gap-1.5 leading-none mb-1">
            <FolderLock className={cn("h-4 w-4 transition-colors duration-300", ruleType === "grant" ? "text-emerald-500" : "text-red-500")} />
            {mode === "edit" ? "Edit Access Rule" : "Create Access Rule"}
          </h2>
          <span className="text-xs text-muted-foreground leading-none">
            {mode === "edit" 
              ? "Modify access permissions and dynamic grantee bounds."
              : "Formulate a new access control statement."}
          </span>
        </div>
      </div>

      {/* Grid columns split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column: Redesigned interactive workspace form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div className={cn(
            "border p-6 rounded-2xl bg-card/30 backdrop-blur-md space-y-6 shadow-sm transition-all duration-300",
            ruleType === "grant" ? "border-emerald-500/15 shadow-emerald-500/[0.015]" : "border-red-500/15 shadow-red-500/[0.015]"
          )}>
            
            {/* Step 1: Select Grantee (Who) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold border transition-colors",
                  whoType ? (ruleType === "grant" ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/35 text-red-600 dark:text-red-400") : "bg-muted/80 border-border/40 text-muted-foreground"
                )}>
                  1
                </span>
                <label className="text-xs font-bold tracking-wider text-muted-foreground/80 uppercase block select-none">
                  Select Grantee (Who)
                </label>
              </div>
              
              {/* High-Fidelity Interactive Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "group", label: "User Group", icon: Users2, desc: "Bind to explicit teams & roles" },
                  { id: "autogroup", label: "Autogroup", icon: Sparkles, desc: "Bind to dynamic system roles" },
                  { id: "user", label: "Individual User", icon: Mail, desc: "Bind directly to email address" },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = whoType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setWhoType(type.id as any)}
                      className={cn(
                        "relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200 ease-in-out cursor-pointer select-none group min-h-[105px]",
                        isSelected
                          ? (ruleType === "grant" 
                              ? "bg-emerald-500/[0.02] border-emerald-500/60 shadow-[0_0_12px_-3px_rgba(16,185,129,0.15)]" 
                              : "bg-red-500/[0.02] border-red-500/60 shadow-[0_0_12px_-3px_rgba(239,68,68,0.15)]")
                          : "bg-muted/20 border-border/40 hover:bg-muted/40 hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {/* Spring selector background indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId="activeWhoType"
                          className={cn(
                            "absolute inset-0 rounded-xl border pointer-events-none",
                            ruleType === "grant" ? "border-emerald-500/40" : "border-red-500/40"
                          )}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      
                      <div className={cn(
                        "p-1.5 rounded-lg mb-2 transition-colors",
                        isSelected 
                          ? (ruleType === "grant" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400") 
                          : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <span className={cn(
                        "text-xs font-bold transition-colors leading-tight mb-0.5",
                        isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {type.label}
                      </span>
                      <span className="text-xs text-muted-foreground/60 leading-normal line-clamp-2">
                        {type.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Conditional Who Sub-Forms with organic spring layout */}
              <motion.div 
                layout="position"
                className="pt-1"
              >
                <AnimatePresence mode="wait">
                  {whoType === null && (
                    <motion.div 
                      key="who-none"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-muted-foreground/60 italic p-4 border border-dashed border-border/30 rounded-xl bg-muted/10 select-none text-center"
                    >
                      No grantee type selected. Select a card type above to set who this rule applies to.
                    </motion.div>
                  )}

                  {whoType === "group" && (
                    <motion.div 
                      key="who-group"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 max-w-md"
                    >
                      <Select value="" onValueChange={handleAddGroup}>
                        <SelectTrigger className="w-full h-9 bg-background/55 border-border/40 text-xs text-foreground focus:ring-1 focus:ring-primary/20">
                          <SelectValue placeholder="Add Group to Rule..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGroups.map((g) => (
                            <SelectItem key={g} value={g} className="font-mono text-xs">
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedGroups.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <AnimatePresence>
                            {selectedGroups.map((g) => (
                              <motion.div
                                key={g}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                              >
                                <Badge
                                  className="flex items-center gap-1 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs px-2 py-0.5 rounded-md font-mono select-none"
                                >
                                  <span>{g}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGroup(g)}
                                    className="hover:bg-violet-500/20 rounded p-0.5 text-violet-500/70 hover:text-violet-500 transition-colors focus:outline-none"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground/60 italic px-0.5 select-none">
                          No groups selected. Add groups from the dropdown above.
                        </div>
                      )}
                    </motion.div>
                  )}

                  {whoType === "autogroup" && (
                    <motion.div 
                      key="who-autogroup"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 max-w-md"
                    >
                      <Select value="" onValueChange={handleAddAutogroup}>
                        <SelectTrigger className="w-full h-9 bg-background/55 border-border/40 text-xs text-foreground focus:ring-1 focus:ring-primary/20">
                          <SelectValue placeholder="Add Autogroup to Rule..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAutogroups.map((ag) => (
                            <SelectItem key={ag} value={ag} className="font-mono text-xs">
                              {ag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedAutogroups.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <AnimatePresence>
                            {selectedAutogroups.map((ag) => (
                              <motion.div
                                key={ag}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                              >
                                <Badge
                                  className="flex items-center gap-1 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-md font-mono select-none"
                                >
                                  <span>{ag}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAutogroup(ag)}
                                    className="hover:bg-indigo-500/20 rounded p-0.5 text-indigo-500/70 hover:text-indigo-500 transition-colors focus:outline-none"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground/60 italic px-0.5 select-none">
                          No autogroups selected. Add autogroups from the dropdown above.
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground/60 leading-normal block select-none px-0.5">
                        Autogroups resolve dynamically based on systemic attributes (e.g. admins vs all active members).
                      </span>
                    </motion.div>
                  )}

                  {whoType === "user" && (
                    <motion.div 
                      key="who-user"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 max-w-md"
                    >
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="e.g. engineer@heapdog.io"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-9 bg-background/55 border-border/40 text-xs font-mono flex-1 focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                        <Button
                          type="button"
                          onClick={handleAddEmail}
                          className="h-9 w-9 p-0 shrink-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {userEmails.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1 max-h-[120px] overflow-y-auto pr-1">
                          <AnimatePresence>
                            {userEmails.map((email, idx) => (
                              <motion.div
                                key={email}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                              >
                                <Badge
                                  className="flex items-center gap-1 bg-primary/10 border-primary/20 hover:bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-md font-mono select-none"
                                >
                                  <span>{email}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEmail(idx)}
                                    className="hover:bg-primary/20 rounded p-0.5 text-primary/70 hover:text-primary transition-colors focus:outline-none"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground/60 italic px-0.5 select-none">
                          No individual users added yet. Type email and click "+" or press Enter.
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground/60 leading-normal select-none px-0.5">
                        Resolves automatically into <code className="font-mono bg-muted/80 px-1 py-0.2 rounded border text-foreground/80">email:address</code> values.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            <hr className="border-border/15" />

            {/* Step 2: Formulate Permission Path (DSL Composer) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold border transition-colors",
                  resource && action ? (ruleType === "grant" ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/35 text-red-600 dark:text-red-400") : "bg-muted/80 border-border/40 text-muted-foreground"
                )}>
                  2
                </span>
                <div className="space-y-0.5 select-none">
                  <label className="text-xs font-bold tracking-wider text-muted-foreground/80 uppercase block leading-none">
                    Formulate Permission Path
                  </label>
                  <span className="text-xs text-muted-foreground/60 block">
                    Synthesize authorization rules naturally.
                  </span>
                </div>
              </div>

              {/* Natural Language Sentence Builder Box */}
              <div className="bg-muted/[0.12] border border-border/30 p-4.5 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-3.5 text-xs font-medium leading-relaxed text-muted-foreground select-none">
                  <span className="shrink-0 text-foreground/75 font-semibold">Subjects will be</span>
                  
                  {/* Premium Slider Toggle Container */}
                  <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/30 relative shrink-0">
                    {[
                      { id: "grant", label: "Allowed", activeClass: "text-emerald-600 dark:text-emerald-400 bg-background shadow-sm border-border/20 font-bold" },
                      { id: "deny", label: "Denied", activeClass: "text-red-600 dark:text-red-400 bg-background shadow-sm border-border/20 font-bold" }
                    ].map((item) => {
                      const isSelected = ruleType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRuleType(item.id as any)}
                          className={cn(
                            "relative px-3.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 leading-none z-10 min-w-[64px] cursor-pointer",
                            isSelected ? item.activeClass : "text-muted-foreground/70 hover:text-foreground"
                          )}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="innerRuleTypePill"
                              className="absolute inset-0 rounded-md border border-border/5 pointer-events-none"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  <span className="shrink-0 text-foreground/75 font-semibold">to access resource</span>

                  {/* Resource dropdown selector */}
                  <div className="min-w-[175px] shrink-0 font-mono">
                    <Select 
                      value={resource} 
                      onValueChange={setResource}
                    >
                      <SelectTrigger className="w-full h-8.5 bg-background/55 border-border/40 text-xs px-2.5 py-0 text-foreground font-mono focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="Select Resource..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableResources.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs font-mono">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <span className="shrink-0 text-foreground/75 font-semibold">and perform action</span>

                  {/* Action dropdown selector */}
                  <div className="min-w-[155px] shrink-0 font-mono">
                    <Select 
                      value={action} 
                      onValueChange={setAction}
                      disabled={!resource}
                    >
                      <SelectTrigger className="w-full h-8.5 bg-background/55 border-border/40 text-xs px-2.5 py-0 text-foreground font-mono focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder={resource ? "Select Action..." : "Select Resource First..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableActions.map((act) => (
                          <SelectItem key={act} value={act} className="text-xs font-mono">
                            {act}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Scoped identifier builder with smooth visual states */}
                {acceptsSelector ? (
                  <div className="pt-3 border-t border-border/15 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                        <input
                          type="radio"
                          name="selector"
                          checked={selectorType === "global"}
                          onChange={() => setSelectorType("global")}
                          className="accent-primary h-3.5 w-3.5"
                        />
                        Global Scope (All Instances)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                        <input
                          type="radio"
                          name="selector"
                          checked={selectorType === "specific"}
                          onChange={() => setSelectorType("specific")}
                          className="accent-primary h-3.5 w-3.5"
                        />
                        Scoped Identifier (UUID)
                      </label>
                    </div>

                    {selectorType === "specific" && (
                      <div className="space-y-1.5 max-w-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <Input
                          type="text"
                          placeholder="e.g. 4b76c8c1-1e96-4a41-b841..."
                          value={selectorValue}
                          onChange={(e) => setSelectorValue(e.target.value)}
                          className="h-8.5 bg-background/50 border-border/40 text-xs font-mono focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                        <span className="text-xs text-muted-foreground/60 leading-normal block select-none">
                          Target UUID limits access solely to that specific entity.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground/65 leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/20 flex gap-2 pt-1 border-t border-border/15 select-none">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      This resource strictly targets global scope. Scoped Identifier selection is locked.
                      <code className="font-mono text-xs bg-muted/80 px-1 py-0.2 rounded border ml-1 text-foreground/80">
                        {resource || "resource"}:{action || "action"}
                      </code>
                    </span>
                  </div>
                )}
              </div>

              {/* Add formulated path triggers */}
              <div className="flex flex-wrap gap-2 pt-1 select-none">
                <Button
                  type="button"
                  onClick={handleAddPermission}
                  disabled={!resource || !action}
                  className={cn(
                    "h-8 px-3.5 text-white font-bold text-xs gap-1 transition-all duration-200 shadow-sm rounded-lg cursor-pointer",
                    !resource || !action 
                      ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed" 
                      : (ruleType === "grant" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10" : "bg-red-600 hover:bg-red-500 shadow-red-500/10")
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {ruleType === "grant" ? "Add to Allows" : "Add to Denies"}
                </Button>
              </div>
            </div>

            <hr className="border-border/15" />

            {/* Step 3: Review Formulated Permissions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold border transition-colors",
                  permissions.length > 0 ? (ruleType === "grant" ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/35 text-red-600 dark:text-red-400") : "bg-muted/80 border-border/40 text-muted-foreground"
                )}>
                  3
                </span>
                <label className="text-xs font-bold tracking-wider text-muted-foreground/80 uppercase block select-none">
                  Review Formulated Permissions
                </label>
              </div>

              <div className="border border-border/30 p-4.5 rounded-xl bg-background/20 backdrop-blur-sm space-y-3">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider block select-none",
                  ruleType === "grant" ? "text-emerald-500" : "text-red-500"
                )}>
                  Active {ruleType === "grant" ? "Allows" : "Denies"} List
                </span>
                
                {permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {permissions.map((p, idx) => (
                        <motion.div
                          key={p}
                          initial={{ opacity: 0, scale: 0.85, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        >
                          <Badge
                            className={cn(
                              "flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md font-mono select-none border shadow-sm",
                              ruleType === "grant"
                                ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-red-500/10 border-red-500/20 hover:bg-red-500/15 text-red-600 dark:text-red-400"
                            )}
                          >
                            <span>{p}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePermission(idx)}
                              className={cn(
                                "rounded p-0.5 transition-colors focus:outline-none cursor-pointer",
                                ruleType === "grant"
                                  ? "hover:bg-emerald-500/20 text-emerald-500/70 hover:text-emerald-500"
                                  : "hover:bg-red-500/20 text-red-500/70 hover:text-red-500"
                              )}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground/50 italic leading-none py-1 select-none">
                    No permission pathways appended to this rule yet. Use Step 2 formulation tools above.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Action triggers */}
          <div className="flex flex-wrap items-center gap-3 pt-2 relative z-10 select-none">
            <Button 
              type="submit" 
              disabled={isSaving || compiledWho.length === 0 || permissions.length === 0}
              className={cn(
                "h-9 px-4.5 text-white font-bold text-xs gap-1.5 transition-all duration-200 shadow-md rounded-xl cursor-pointer",
                compiledWho.length === 0 || permissions.length === 0
                  ? "bg-muted text-muted-foreground shadow-none cursor-not-allowed border-transparent"
                  : (ruleType === "grant" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10" : "bg-red-600 hover:bg-red-500 shadow-red-500/10")
              )}
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === "edit" ? "Save Policy Changes" : "Compile & Save Rule"}
            </Button>
            
            <Button 
              variant="outline" 
              type="button" 
              onClick={handleReset}
              disabled={isSaving}
              className="h-9 px-4 text-xs font-semibold hover:bg-red-500/[0.04] hover:text-red-500 hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
            >
              Reset Form
            </Button>
            
            <Link href={`/organizations/${slug}/dashboard/acls/visual/general-access-rules`}>
              <Button 
                variant="outline" 
                type="button" 
                disabled={isSaving}
                className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        {/* Right Column: Live simulated JSON Compiler (IDE View) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4 relative z-10">
          <div className={cn(
            "border rounded-xl overflow-hidden bg-zinc-950 shadow-2xl transition-all duration-300",
            permissions.length > 0 
              ? (ruleType === "grant" ? "border-emerald-500/25 shadow-emerald-500/[0.015]" : "border-red-500/25 shadow-red-500/[0.015]") 
              : "border-zinc-800 shadow-black/40"
          )}>
            {/* Terminal Header bar */}
            <div className="flex items-center justify-between bg-zinc-900/90 border-b border-zinc-800 px-4 py-3 select-none">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-extrabold font-mono tracking-wider">
                <Terminal className="h-3.5 w-3.5 text-zinc-600 animate-pulse" />
                <span>acl.json — LIVE COMPILER</span>
              </div>
              
              {/* Copier */}
              <button
                type="button"
                onClick={handleCopyJson}
                disabled={permissions.length === 0}
                className={cn(
                  "p-1.5 rounded-lg border transition-all text-zinc-500 hover:text-zinc-300 cursor-pointer",
                  permissions.length === 0 ? "border-transparent opacity-30 cursor-not-allowed" : "border-zinc-800 hover:bg-zinc-800/50"
                )}
                title="Copy Compiled JSON"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500 animate-in zoom-in-50" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>

            {/* Code Body with glowing schema highlight */}
            <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto min-h-[220px] bg-zinc-950/80 relative text-zinc-400">
              <pre>
                <span className="text-zinc-500">{"{"}</span>
                {permissions.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`${ruleType}-${permissions.length}-${compiledWho.length}`}
                  >
                    {"\n  "}
                    <span className="text-purple-400">"{ruleType === "grant" ? "grants" : "denies"}"</span>: <span className="text-yellow-600">[</span>
                    {"\n    "}
                    <span className="text-yellow-600">{"{"}</span>
                    {"\n      "}
                    <span className="text-purple-400">"who"</span>: <span className="text-yellow-600">[</span>
                    {compiledWho.length > 0 ? (
                      compiledWho.map((whoItem, idx) => (
                        <span key={whoItem}>
                          {idx > 0 && <span className="text-zinc-500">, </span>}
                          <span className={cn(ruleType === "grant" ? "text-emerald-400" : "text-red-400")}>"{whoItem}"</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-600 italic">/* Select subjects above */</span>
                    )}
                    <span className="text-yellow-600">]</span>,
                    {"\n      "}
                    <span className="text-purple-400">"permissions"</span>: <span className="text-yellow-600">[</span>
                    {permissions.map((p, idx) => (
                      <span key={p}>
                        {idx > 0 && <span className="text-zinc-500">, </span>}
                        <span className={cn(ruleType === "grant" ? "text-emerald-400" : "text-red-400")}>"{p}"</span>
                      </span>
                    ))}
                    <span className="text-yellow-600">]</span>
                    {"\n    "}
                    <span className="text-yellow-600">{"}"}</span>
                    {"\n  "}
                    <span className="text-yellow-600">]</span>
                  </motion.div>
                ) : (
                  <div className="py-8 text-center text-zinc-600 italic select-none">
                    // Formulate path & grantee items to compile policy
                  </div>
                )}
                {"\n"}
                <span className="text-zinc-500">{"}"}</span>
              </pre>
            </div>
            
            {/* Terminal Status bar footer */}
            <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-2.5 flex items-center justify-between select-none">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full inline-block animate-pulse",
                  permissions.length > 0 ? "bg-emerald-500" : "bg-zinc-600"
                )} />
                <span className={permissions.length > 0 ? "text-emerald-500" : "text-zinc-500"}>
                  {permissions.length > 0 ? "✓ Compiled" : "Idle"}
                </span>
              </div>
              <Badge variant="outline" className="border-zinc-800 text-[10px] text-zinc-500 font-mono tracking-wider font-extrabold px-1.5 py-0 h-4">
                JSON
              </Badge>
            </div>
          </div>

          {/* Real-time security notice */}
          <div className={cn(
            "border p-4.5 rounded-xl flex gap-3.5 text-xs leading-relaxed transition-all duration-300 select-none shadow-sm",
            ruleType === "deny"
              ? "bg-red-500/[0.02] border-red-500/15 text-red-800 dark:text-red-400"
              : "bg-emerald-500/[0.02] border-emerald-500/15 text-emerald-800 dark:text-emerald-400"
          )}>
            {ruleType === "deny" ? (
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold block tracking-tight text-foreground/90">
                {ruleType === "deny" ? "Deny Precedence Active" : "Whitelist Architecture Active"}
              </span>
              <p className="opacity-80">
                {ruleType === "deny" 
                  ? "Caution: Deny policies possess absolute hierarchy. Matching subjects are completely blocked from executing target actions even if allowed explicitly elsewhere."
                  : "Grantees are restricted to executing permissions configured in active allows. Any access attempt outside explicit allow sets will be blocked by default."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
