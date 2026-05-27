"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Check,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Loader2,
  FileCode,
  Lock,
  Save,
  PanelRightClose,
  PanelRightOpen,
  Users,
  ShieldCheck,
  ShieldOff,
  Copy,
  Download,
  Upload,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMyPermissions } from "@/hooks/use-my-permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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

interface FileEditorViewProps {
  initialAcl: AclConfig;
  users: Record<string, ApiUser>;
  slug: string;
}

// --- Helpers ---

function isUserIdentifier(str: string): boolean {
  if (str.startsWith("email:") || str.startsWith("uuid:")) return true;
  if (str.includes("@") && !str.includes(":") && !str.includes(" ") && str.length > 3) return true;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return true;
  return false;
}

function resolveUser(
  identifier: string,
  users: Record<string, ApiUser>
): { name: string; email: string; pictureUrl?: string | null } | null {
  const isUuid = identifier.startsWith("uuid:") || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  const isEmail = identifier.startsWith("email:") || (identifier.includes("@") && !identifier.includes(":"));

  if (isUuid) {
    const uuid = identifier.startsWith("uuid:") ? identifier.substring(5) : identifier;
    const u = users[uuid];
    if (u) return { name: u.name, email: u.email, pictureUrl: u.pictureUrl || null };
    return { name: "Unknown User", email: `UUID: ${uuid}`, pictureUrl: null };
  }

  if (isEmail) {
    const email = identifier.startsWith("email:") ? identifier.substring(6) : identifier;
    const u = Object.values(users).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (u) return { name: u.name, email: u.email, pictureUrl: u.pictureUrl || null };
    return { name: "External Email", email, pictureUrl: null };
  }

  const u = Object.values(users).find(
    (u) => u.id === identifier || u.email?.toLowerCase() === identifier.toLowerCase()
  );
  if (u) return { name: u.name, email: u.email, pictureUrl: u.pictureUrl || null };

  return null;
}

function getDisplayLabel(identifier: string, users: Record<string, ApiUser>): string {
  const resolved = resolveUser(identifier, users);
  if (resolved?.email) return resolved.email;
  if (identifier.startsWith("email:")) return identifier.substring(6);
  return identifier;
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function highlightJson(json: string, hoveredIdentifier?: string | null): React.ReactNode[] {
  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[{}[\],:]|\s+|[^\s{}[\],:]+)/g;
  const tokens: React.ReactNode[] = [];
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(json)) !== null) {
    const token = match[0];
    keyIndex++;

    if (token.startsWith('"')) {
      if (token.endsWith(':')) {
        tokens.push(
          <span key={keyIndex} className="text-violet-600 dark:text-violet-400 font-semibold">
            {token.slice(0, -1)}
          </span>
        );
        tokens.push(<span key={`colon-${keyIndex}`} className="text-foreground/50">:</span>);
      } else {
        const inner = token.slice(1, -1);
        if (isUserIdentifier(inner)) {
          const isHovered = inner === hoveredIdentifier;
          tokens.push(
            <span
              key={keyIndex}
              className={cn(
                "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 rounded shadow-[0_0_0_1px_rgba(16,185,129,0.3)] data-user-pill cursor-pointer transition-all duration-150 select-text",
                isHovered && "bg-emerald-500/20 shadow-[0_0_0_1px_rgba(16,185,129,0.6)] text-emerald-500 dark:text-emerald-300"
              )}
              data-user-identifier={inner}
            >
              {token}
            </span>
          );
        } else {
          tokens.push(
            <span key={keyIndex} className="text-emerald-600 dark:text-emerald-400">
              {token}
            </span>
          );
        }
      }
    } else if (/^(true|false)$/.test(token)) {
      tokens.push(
        <span key={keyIndex} className="text-amber-600 dark:text-amber-500 font-medium">
          {token}
        </span>
      );
    } else if (token === "null") {
      tokens.push(
        <span key={keyIndex} className="text-muted-foreground/50 italic">
          {token}
        </span>
      );
    } else if (/^-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?$/.test(token)) {
      tokens.push(
        <span key={keyIndex} className="text-cyan-600 dark:text-cyan-400">
          {token}
        </span>
      );
    } else if (/[{}[\],:]/.test(token)) {
      tokens.push(
        <span key={keyIndex} className="text-foreground/40">
          {token}
        </span>
      );
    } else {
      tokens.push(token);
    }
  }

  return tokens;
}

// --- Main Component ---

export function FileEditorView({ initialAcl, users = {}, slug }: FileEditorViewProps) {
  const { check } = useMyPermissions(slug);
  const canWrite = check("acl:write");

  const [viewMode, setViewMode] = useState<"uuid" | "email">("email");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const [savedAcl, setSavedAcl] = useState<AclConfig>(initialAcl);
  const [usersList, setUsersList] = useState<Record<string, ApiUser>>(users);
  const [hoveredIdentifier, setHoveredIdentifier] = useState<string | null>(null);
  const [hoveredUser, setHoveredUser] = useState<{
    name: string;
    email: string;
    id?: string;
    pictureUrl?: string | null;
    x: number;
    y: number;
  } | null>(null);
  const [saveErrors, setSaveErrors] = useState<string[] | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [lastToastTime, setLastToastTime] = useState(0);

  const handleReadOnlyInteraction = useCallback(() => {
    if (canWrite) return;
    const now = Date.now();
    if (now - lastToastTime > 3000) {
      setLastToastTime(now);
      toast.info("This policy is in View-Only Mode", {
        icon: "🔒",
        description: "You don't have write permissions to modify access control rules.",
        duration: 3500,
      });
    }
  }, [canWrite, lastToastTime]);

  // --- UUID <-> Email translation ---

  const translateUuidToEmail = useCallback((acl: AclConfig, customUsers?: Record<string, ApiUser>): AclConfig => {
    const activeUsers = customUsers || usersList;
    const newAcl: AclConfig = JSON.parse(JSON.stringify(acl));

    const replaceStr = (str: string) => {
      if (str.startsWith("uuid:")) {
        const uuid = str.substring(5);
        const user = activeUsers[uuid];
        if (user?.email) return `email:${user.email}`;
      }
      return str;
    };

    if (newAcl.groups) {
      for (const key of Object.keys(newAcl.groups)) {
        if (Array.isArray(newAcl.groups[key])) {
          newAcl.groups[key] = newAcl.groups[key].map(replaceStr);
        }
      }
    }
    for (const rule of newAcl.grants ?? []) {
      if (Array.isArray(rule.who)) rule.who = rule.who.map(replaceStr);
    }
    for (const rule of newAcl.denies ?? []) {
      if (Array.isArray(rule.who)) rule.who = rule.who.map(replaceStr);
    }
    return newAcl;
  }, [usersList]);

  const translateEmailToUuid = useCallback((acl: AclConfig, customUsers?: Record<string, ApiUser>): AclConfig => {
    const activeUsers = customUsers || usersList;
    const newAcl: AclConfig = JSON.parse(JSON.stringify(acl));

    const emailToUuidMap: Record<string, string> = {};
    for (const [uuid, user] of Object.entries(activeUsers)) {
      if (user.email) emailToUuidMap[user.email.toLowerCase()] = uuid;
    }

    const replaceStr = (str: string) => {
      if (str.startsWith("email:")) {
        const email = str.substring(6).toLowerCase();
        const uuid = emailToUuidMap[email];
        if (uuid) return `uuid:${uuid}`;
      }
      return str;
    };

    if (newAcl.groups) {
      for (const key of Object.keys(newAcl.groups)) {
        if (Array.isArray(newAcl.groups[key])) {
          newAcl.groups[key] = newAcl.groups[key].map(replaceStr);
        }
      }
    }
    for (const rule of newAcl.grants ?? []) {
      if (Array.isArray(rule.who)) rule.who = rule.who.map(replaceStr);
    }
    for (const rule of newAcl.denies ?? []) {
      if (Array.isArray(rule.who)) rule.who = rule.who.map(replaceStr);
    }
    return newAcl;
  }, [usersList]);

  // --- Editor state ---

  const getInitialString = () => {
    const policy = translateUuidToEmail(initialAcl);
    return JSON.stringify(policy, null, 2);
  };

  const [jsonText, setJsonText] = useState(getInitialString);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const hoverTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const lineCount = jsonText.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // --- Cursor position tracking ---
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  const updateCursorPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const textBefore = jsonText.substring(0, pos);
    const line = textBefore.split("\n").length;
    const col = pos - textBefore.lastIndexOf("\n");
    setCursorLine(line);
    setCursorCol(col);
  }, [jsonText]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;

    // Raycast: temporarily turn off textarea and turn ON pre layer pointer events
    textarea.style.pointerEvents = "none";
    highlight.style.pointerEvents = "auto";
    const element = document.elementFromPoint(e.clientX, e.clientY);
    textarea.style.pointerEvents = "auto";
    highlight.style.pointerEvents = "none";

    const pill = element?.closest(".data-user-pill");
    if (pill) {
      const identifier = pill.getAttribute("data-user-identifier");
      if (identifier) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        setHoveredIdentifier(identifier);
        const resolved = resolveUser(identifier, usersList);
        if (resolved) {
          const rect = textarea.getBoundingClientRect();
          const isUuid = identifier.startsWith("uuid:") || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
          const cleanId = isUuid ? (identifier.startsWith("uuid:") ? identifier.substring(5) : identifier) : undefined;
          setHoveredUser({
            name: resolved.name || resolved.email || "Unknown User",
            email: resolved.email || "unknown@heapdog.io",
            id: cleanId,
            pictureUrl: resolved.pictureUrl || null,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top - 12,
          });
          return;
        }
      }
    }

    if (!hoverTimeoutRef.current) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredIdentifier(null);
        setHoveredUser(null);
        hoverTimeoutRef.current = null;
      }, 100);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = inspectorWidth;

    const handleMouseMoveDrag = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(240, Math.min(600, startWidth - deltaX));
      setInspectorWidth(newWidth);
    };

    const handleMouseUpDrag = () => {
      document.removeEventListener("mousemove", handleMouseMoveDrag);
      document.removeEventListener("mouseup", handleMouseUpDrag);
    };

    document.addEventListener("mousemove", handleMouseMoveDrag);
    document.addEventListener("mouseup", handleMouseUpDrag);
  };

  const highlightedContent = useMemo(() => {
    const highlighted = highlightJson(jsonText, hoveredIdentifier);
    if (jsonText.endsWith("\n")) {
      highlighted.push(<span key="trailing-newline" className="select-none"> </span>);
    }
    return highlighted;
  }, [jsonText, hoveredIdentifier]);

  // Real-time JSON validation & syntax error derivation (No useEffect to avoid cascading render warning)
  const { isValid, syntaxError } = useMemo(() => {
    if (!jsonText.trim()) {
      return { isValid: false, syntaxError: "Empty document" };
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { isValid: false, syntaxError: "Root must be a JSON object" };
      }
      return { isValid: true, syntaxError: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      return { isValid: false, syntaxError: message };
    }
  }, [jsonText]);

  // Tab key indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = jsonText.substring(0, start) + "  " + jsonText.substring(end);
      setJsonText(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // --- Actions ---

  const handleToggleMode = (mode: "uuid" | "email") => {
    if (mode === viewMode) return;
    if (!isValid) {
      toast.error("Fix syntax errors before switching view mode");
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      const converted = mode === "uuid"
        ? translateEmailToUuid(parsed)
        : translateUuidToEmail(parsed);
      setJsonText(JSON.stringify(converted, null, 2));
      setViewMode(mode);
    } catch (err) {
      toast.error("Translation failed: " + String(err));
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setShowSaveSuccess(false);
      setSaveErrors(null);
    } catch {
      toast.error("Fix syntax errors before formatting");
    }
  };

  const handleConfirmReset = () => {
    const policy = viewMode === "email" ? translateUuidToEmail(savedAcl) : savedAcl;
    setJsonText(JSON.stringify(policy, null, 2));
    setShowSaveSuccess(false);
    setSaveErrors(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setIsCopied(true);
      toast.success("Policy copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy policy: " + String(err));
    }
  };

  const handleExport = () => {
    try {
      const blob = new Blob([jsonText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "acl.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Policy exported successfully as acl.json");
    } catch (err) {
      toast.error("Failed to export policy: " + String(err));
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        JSON.parse(text);
        setJsonText(text);
        setShowSaveSuccess(false);
        setSaveErrors(null);
        toast.success("Policy imported successfully");
      } catch {
        toast.error("Import failed: File is not a valid JSON document");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canWrite) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!canWrite) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canWrite) return;
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast.error("Drop failed: File must be a JSON document");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        JSON.parse(text);
        setJsonText(text);
        setShowSaveSuccess(false);
        setSaveErrors(null);
        toast.success("Policy imported successfully");
      } catch {
        toast.error("Import failed: File is not a valid JSON document");
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    setSaveErrors(null);
    setShowSaveSuccess(false);
    try {
      let finalPolicyObj = JSON.parse(jsonText);
      if (viewMode === "email") {
        finalPolicyObj = translateEmailToUuid(finalPolicyObj);
      }
      const response = await fetch(`/api/organizations/${slug}/acl`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPolicyObj),
      });
      const result = await response.json();
      if (!response.ok) {
        throw result;
      }
      
      const updatedAcl = result.data?.acl || result.data || finalPolicyObj;
      const updatedUsers = result.data?.users || usersList;
      
      setSavedAcl(updatedAcl);
      setUsersList(updatedUsers);

      const policy = viewMode === "email" ? translateUuidToEmail(updatedAcl, updatedUsers) : updatedAcl;
      setJsonText(JSON.stringify(policy, null, 2));

      setShowSaveSuccess(true);
    } catch (err: any) {
      const errorMessage = err?.error || "An unexpected error occurred";
      const details = err?.details;

      if (details && Array.isArray(details) && details.length > 0) {
        const errors = details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`);
        setSaveErrors(errors);
      } else {
        setSaveErrors([errorMessage]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // --- Derived data ---

  const { stats, parsedGroups, parsedGrants, parsedDenies } = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText);
      return {
        stats: {
          groupKeys: parsed.groups ? Object.keys(parsed.groups).length : 0,
          grantRules: Array.isArray(parsed.grants) ? parsed.grants.length : 0,
          denyRules: Array.isArray(parsed.denies) ? parsed.denies.length : 0,
        },
        parsedGroups: (parsed.groups ?? null) as Record<string, string[]> | null,
        parsedGrants: (Array.isArray(parsed.grants) ? parsed.grants : null) as AclRule[] | null,
        parsedDenies: (Array.isArray(parsed.denies) ? parsed.denies : null) as AclRule[] | null,
      };
    } catch {
      return {
        stats: { groupKeys: 0, grantRules: 0, denyRules: 0 },
        parsedGroups: null,
        parsedGrants: null,
        parsedDenies: null,
      };
    }
  }, [jsonText]);

  const hasUnsavedChanges = useMemo(() => {
    try {
      const parsedCurrent = JSON.parse(jsonText);
      const canonicalCurrent = viewMode === "email"
        ? translateEmailToUuid(parsedCurrent)
        : parsedCurrent;
      return JSON.stringify(canonicalCurrent) !== JSON.stringify(savedAcl);
    } catch {
      return true;
    }
  }, [jsonText, viewMode, translateEmailToUuid, savedAcl]);

  // Check for responsive inspector default (Using requestAnimationFrame to avoid synchronous setState inside effect warning)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    const matches = mql.matches;
    requestAnimationFrame(() => {
      setInspectorOpen(matches);
    });
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-11.5rem)] min-h-[420px]">

      {/* Premium Read-only banner */}
      {!canWrite && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-4 px-4 py-3 bg-gradient-to-r from-amber-500/[0.03] via-amber-500/[0.05] to-amber-500/[0.01] border border-amber-500/15 rounded-2xl mb-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300 shadow-md backdrop-blur-sm select-none shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center size-7 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Lock className="size-3.5" />
              <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="font-semibold text-foreground mr-1.5">View-Only Mode</span>
              <span className="text-muted-foreground/80 font-medium">
                You do not have write permissions to modify this organization policy.
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 select-none">
            Read Only
          </div>
        </motion.div>
      )}

      {/* Editor container */}
      <div className="flex-1 flex min-h-0 rounded-xl border border-border/60 dark:border-border/30 overflow-hidden bg-card shadow-xl">

        {/* Left: Editor panel */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Title bar */}
          <div className="flex items-center justify-between bg-muted/50 dark:bg-muted/20 border-b border-border/40 px-4 py-2 shrink-0 select-none gap-2">

            {/* Left side: file tab + view toggle */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Traffic lights */}
              <div className="flex gap-1.5 shrink-0">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-yellow-500/80" />
                <span className="size-3 rounded-full bg-green-500/80" />
              </div>

              {/* File tab */}
              <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground font-medium shrink-0">
                <FileCode className="size-3.5 text-muted-foreground/70" />
                <span>acl.json</span>
                {hasUnsavedChanges && (
                  <span className="size-2 rounded-full bg-primary animate-pulse" title="Unsaved changes" />
                )}
              </div>

              {/* Separator */}
              <div className="h-4 w-px bg-border/40 shrink-0" />

              {/* View mode toggle */}
              <div className="flex bg-muted dark:bg-background/50 p-0.5 rounded-lg border border-border/40 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleMode("email")}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    viewMode === "email"
                      ? "bg-background dark:bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Emails
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode("uuid")}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    viewMode === "uuid"
                      ? "bg-background dark:bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  UUIDs
                </button>
              </div>
            </div>

            {/* Right side: actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsResetOpen(true)}
                      disabled={!canWrite || !hasUnsavedChanges}
                      className="h-7 w-7 p-0"
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!canWrite ? "You do not have write access to this policy" : "Reset to saved"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFormat}
                      disabled={!canWrite}
                      className="h-7 w-7 p-0"
                    >
                      <Sparkles className="size-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!canWrite ? "You do not have write access to this policy" : "Format document"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 w-7 p-0"
                  >
                    {isCopied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isCopied ? "Copied!" : "Copy policy"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                    className="h-7 w-7 p-0"
                  >
                    <Download className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Export policy
                </TooltipContent>
              </Tooltip>

              {canWrite && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 w-7 p-0"
                      >
                        <Upload className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Import policy
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              <div className="h-4 w-px bg-border/40 mx-0.5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!canWrite || !isValid || isSaving || !hasUnsavedChanges}
                      className={cn(
                        "h-7 gap-1.5 text-xs font-medium px-3",
                        canWrite && isValid && hasUnsavedChanges
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/15"
                          : ""
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      {isSaving ? "Saving…" : "Save Changes"}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!canWrite 
                    ? "You do not have write access to this policy" 
                    : !isValid 
                    ? "Fix JSON syntax errors to save" 
                    : !hasUnsavedChanges 
                    ? "No unsaved changes" 
                    : "Save changes to server"}
                </TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-border/40 mx-0.5" />

              {/* Inspector toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInspectorOpen((v) => !v)}
                    className="h-7 w-7 p-0"
                  >
                    {inspectorOpen ? (
                      <PanelRightClose className="size-3.5" />
                    ) : (
                      <PanelRightOpen className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{inspectorOpen ? "Close inspector" : "Open inspector"}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 flex overflow-hidden font-mono text-sm bg-background relative min-h-0">
            {/* Line gutter */}
            <div
              ref={gutterRef}
              className="w-12 sm:w-14 bg-muted/30 dark:bg-muted/10 text-right pr-3 py-4 border-r border-border/30 select-none overflow-hidden text-muted-foreground/50 font-medium text-xs leading-[21px]"
            >
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            {/* Editor viewports wrapper */}
            <div className="flex-1 relative overflow-hidden h-full">
              {/* Highlighted text layer */}
              <pre
                aria-hidden="true"
                className="absolute inset-0 px-4 py-4 pointer-events-none select-none whitespace-pre overflow-hidden font-mono text-sm leading-[21px] text-foreground/90 w-full h-full"
                ref={highlightRef}
              >
                {highlightedContent}
              </pre>

              {/* Textarea (text is transparent, but caret is visible) */}
              <textarea
                ref={textareaRef}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setShowSaveSuccess(false);
                  if (saveErrors) setSaveErrors(null);
                }}
                onScroll={handleScroll}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                  setHoveredUser(null);
                  setHoveredIdentifier(null);
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onKeyDown={(e) => {
                  if (!canWrite) {
                    e.preventDefault();
                    handleReadOnlyInteraction();
                    return;
                  }
                  handleKeyDown(e);
                }}
                onKeyUp={updateCursorPosition}
                onClick={(e) => {
                  if (!canWrite) {
                    handleReadOnlyInteraction();
                  }
                  updateCursorPosition();
                }}
                spellCheck={false}
                readOnly={!canWrite}
                className={cn(
                  "absolute inset-0 bg-transparent text-transparent caret-foreground px-4 py-4 resize-none outline-none overflow-y-auto block focus:ring-0 whitespace-pre font-mono text-sm leading-[21px] w-full h-full selection:bg-primary/20",
                  !canWrite && "opacity-90 select-text cursor-text selection:bg-amber-500/25"
                )}
                style={{ caretColor: canWrite ? "var(--primary)" : "transparent" }}
                placeholder="// Write access control rules…"
              />

              {/* Drag-and-Drop Overlay */}
              {canWrite && isDragging && (
                <div 
                  className="absolute inset-0 bg-background/75 backdrop-blur-[1.5px] border-2 border-dashed border-violet-500/40 rounded-lg flex flex-col items-center justify-center gap-3 z-50 animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-none font-sans text-center px-6"
                >
                  <div className="size-12 rounded-full bg-violet-500/10 text-violet-500 dark:bg-violet-950/30 dark:text-violet-400 flex items-center justify-center animate-bounce">
                    <Upload className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-foreground">
                      Drop JSON Policy File
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Release your file to instantly populate the editor
                    </div>
                  </div>
                </div>
              )}

              {/* Floating User Card */}
              {hoveredUser && (
                <div
                  className="absolute z-50 bg-popover text-popover-foreground border border-border/85 shadow-2xl rounded-xl p-3 flex items-center gap-3 w-72 animate-in fade-in slide-in-from-bottom-1 duration-150 select-none pointer-events-none font-sans transition-[left,top] duration-150 ease-out"
                  style={{
                    left: `${hoveredUser.x}px`,
                    top: `${hoveredUser.y}px`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  {hoveredUser.pictureUrl ? (
                    <img
                      src={hoveredUser.pictureUrl}
                      alt={hoveredUser.name}
                      className="h-10 w-10 rounded-full object-cover shrink-0 border border-violet-500/20 select-none animate-in fade-in duration-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700/60 shadow-sm animate-in fade-in duration-200">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="font-semibold text-xs text-foreground truncate">
                      {hoveredUser.name}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">
                      {hoveredUser.email}
                    </div>
                    {hoveredUser.id && (
                      <div className="font-mono text-[9px] text-muted-foreground/60 truncate flex items-center gap-1 select-all pointer-events-auto">
                        <span className="font-semibold select-none">UUID:</span>
                        {hoveredUser.id}
                      </div>
                    )}
                  </div>
                  {/* Pointing Arrow */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-popover border-r border-b border-border/85" />
                </div>
              )}
            </div>
          </div>

          {/* Persistent save errors panel */}
          {saveErrors && saveErrors.length > 0 && (
            <div className="bg-red-500/5 dark:bg-red-950/10 border-t border-red-500/20 px-4 py-2.5 shrink-0 select-text max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-600 dark:text-red-400 font-semibold text-xs flex items-center gap-1.5 font-sans">
                  <AlertCircle className="size-3.5" />
                  Save Failed
                </span>
                <Button
                  variant="ghost"
                  className="h-5 px-1.5 hover:bg-red-500/10 text-red-600 dark:text-red-400/80 rounded text-[10px] font-medium font-sans"
                  onClick={() => setSaveErrors(null)}
                >
                  Dismiss
                </Button>
              </div>
              <div className="space-y-1 font-mono text-[11px] leading-relaxed text-red-600/90 dark:text-red-400/90">
                {saveErrors.map((errStr, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-red-500 font-medium shrink-0 font-sans">•</span>
                    <span className="break-all">{errStr}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className="flex items-center justify-between bg-muted/40 dark:bg-muted/15 border-t border-border/30 px-4 py-1.5 shrink-0 select-none text-xs">
            <div className="flex items-center gap-3">
              {isValid ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in duration-200">
                  <Check className="size-3.5" />
                  {showSaveSuccess ? "Saved successfully" : "Valid"}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400 font-medium">
                  <AlertCircle className="size-3.5" />
                  <span className="truncate max-w-80">{syntaxError}</span>
                </span>
              )}
              {hasUnsavedChanges && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Modified</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground/60 font-mono text-[11px]">
              <span>Ln {cursorLine}, Col {cursorCol}</span>
              <span>{lineCount} lines</span>
              <span>UTF-8</span>
            </div>
          </div>
        </div>

        {/* Draggable Divider Splitter */}
        {inspectorOpen && (
          <div
            className="w-1.5 h-full cursor-col-resize hover:bg-violet-500/25 active:bg-violet-500/40 select-none shrink-0 border-l border-r border-transparent transition-colors duration-150 z-40 relative flex items-center justify-center group"
            onMouseDown={handleMouseDown}
          >
            {/* Draggable indicator line */}
            <div className="w-[1px] h-8 bg-border/40 group-hover:bg-violet-500/60 group-active:bg-violet-500/80 transition-colors" />
          </div>
        )}

        {/* Right: Inspector panel */}
        {inspectorOpen && (
          <div
            className="border-l border-border/30 bg-muted/20 dark:bg-muted/5 shrink-0 overflow-y-auto"
            style={{ width: `${inspectorWidth}px` }}
          >
            <div className="p-4 space-y-5">

              {/* Overview */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Overview
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background border border-border/30 rounded-lg p-3 text-center">
                    <span className="block text-xl font-bold text-violet-500">
                      {stats.groupKeys}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Groups
                    </span>
                  </div>
                  <div className="bg-background border border-border/30 rounded-lg p-3 text-center">
                    <span className="block text-xl font-bold text-emerald-500">
                      {stats.grantRules}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Grants
                    </span>
                  </div>
                  <div className="bg-background border border-border/30 rounded-lg p-3 text-center">
                    <span className="block text-xl font-bold text-red-500">
                      {stats.denyRules}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Denies
                    </span>
                  </div>
                </div>
              </section>

              {/* Groups */}
              {parsedGroups && Object.keys(parsedGroups).length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    Groups
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(parsedGroups).map(([groupName, membersList]) => {
                      if (!Array.isArray(membersList)) return null;
                      return (
                        <div key={groupName} className="space-y-2 pb-3 border-b border-border/20 last:border-b-0 last:pb-0">
                          <span className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/8 px-2 py-0.5 rounded border border-violet-500/15 inline-block select-all">
                            {groupName}
                          </span>
                          {membersList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {membersList.map((member, idx) => (
                                <span
                                  key={`${member}-${idx}`}
                                  className="inline-flex items-center font-mono text-xs px-2 py-0.5 border rounded bg-muted/50 text-foreground/80 border-border/30 select-all"
                                >
                                  {getDisplayLabel(member, usersList)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">
                              No members
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
 
              {/* Rules */}
              {((parsedGrants && parsedGrants.length > 0) || (parsedDenies && parsedDenies.length > 0)) && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Rules
                  </h3>
                  <div className="space-y-4">
                    {/* Grants */}
                    {parsedGrants && parsedGrants.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="size-3.5" />
                          Grants
                        </div>
                        <div className="space-y-2">
                          {parsedGrants.map((rule, idx) => (
                            <RuleCard
                              key={`grant-${idx}`}
                              rule={rule}
                              users={usersList}
                              variant="grant"
                            />
                          ))}
                        </div>
                      </div>
                    )}
 
                    {/* Denies */}
                    {parsedDenies && parsedDenies.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400">
                          <ShieldOff className="size-3.5" />
                          Denies
                        </div>
                        <div className="space-y-2">
                          {parsedDenies.map((rule, idx) => (
                            <RuleCard
                              key={`deny-${idx}`}
                              rule={rule}
                              users={usersList}
                              variant="deny"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Visual editor link */}
              <section className="pt-2">
                <Link
                  href={`/organizations/${slug}/dashboard/acls/visual/general-access-rules`}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border/30 bg-background hover:bg-muted/50 transition-colors text-sm group"
                >
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    Visual Editor
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors" />
                </Link>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Rich Alert Dialog for Discarding Changes */}
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500 shrink-0" />
              Discard Unsaved Changes?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will revert the policy editor back to the last successfully saved document. All your current changes will be lost permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm font-sans"
              onClick={handleConfirmReset}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Rule card sub-component ---

function RuleCard({
  rule,
  users,
  variant,
}: {
  rule: AclRule;
  users: Record<string, ApiUser>;
  variant: "grant" | "deny";
}) {
  const isGrant = variant === "grant";
  return (
    <div className="bg-background border border-border/20 p-3 rounded-lg space-y-2">
      {/* Who */}
      <div className="flex flex-wrap gap-1.5">
        {rule.who?.map((member, idx) => (
          <span
            key={`${member}-${idx}`}
            className={cn(
              "inline-flex items-center font-mono text-xs px-2 py-0.5 border rounded select-all break-all max-w-full whitespace-normal",
              isGrant
                ? "bg-violet-500/5 text-violet-600 dark:text-violet-400 border-violet-500/15"
                : "bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/15"
            )}
          >
            {getDisplayLabel(member, users)}
          </span>
        ))}
      </div>
      {/* Permissions */}
      <div className="flex flex-wrap gap-1">
        {rule.permissions?.map((p) => (
          <Badge
            key={p}
            variant="outline"
            className={cn(
              "font-mono text-[11px] py-0.5 px-1.5 rounded min-h-5 h-auto leading-normal break-all whitespace-normal max-w-full text-left inline-block",
              isGrant
                ? "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-red-500/8 text-red-600 dark:text-red-400 border-red-500/20"
            )}
          >
            {p}
          </Badge>
        ))}
      </div>
    </div>
  );
}
