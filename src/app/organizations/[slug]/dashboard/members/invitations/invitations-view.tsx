"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Send, Mail, User as UserIcon, ChevronLeft, ChevronRight, MoreHorizontal, Calendar, Hash, Activity, Ban, Search, AtSign, AlertTriangle, X, Copy, Link, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PaginatedData } from "@/lib/types/api";
import { useMutation } from "@tanstack/react-query";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OrganizationInvitation, InvitationStatus } from "@/lib/types/organization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/lib/types/user";
import { useMyPermissions } from "@/hooks/use-my-permissions";

interface InvitationsViewProps {
  organizationSlug: string;
  initialData: PaginatedData<OrganizationInvitation> | null;
  currentUserRole?: string;
  ownerId?: string;
  currentUser?: User;
}

interface UserSuggestion {
    id: string;
    username: string;
    name: string;
    email: string;
    pictureUrl?: string | null;
    invitationStatus?: InvitationStatus;
}

const inviteSchema = z.object({
  email: z.string().min(1, "Please enter an email or search for a user"),
}).refine((data) => {
    // We allow either a valid email OR we will rely on the user selection mechanism
    // But for the final submission we probably want an email.
    // Let's simpler validation: if it contains @, it must be valid email.
    if (data.email.includes("@")) {
        return z.string().email().safeParse(data.email).success;
    }
    return true; // Allow non-email strings during typing/search
}, {
    message: "Invalid email address",
    path: ["email"]
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InvitationsView({ organizationSlug, initialData, currentUserRole, ownerId, currentUser }: InvitationsViewProps) {
  const { check } = useMyPermissions(organizationSlug);
  const canInvite = check("invitation:write");

  const [status, setStatus] = useState<"idle" | "checking" | "checked" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invitationToRevoke, setInvitationToRevoke] = useState<OrganizationInvitation | null>(null);
  
  // Hover Popover States (Portal-based to avoid overflow clipping)
  const [hoveredInvitation, setHoveredInvitation] = useState<OrganizationInvitation | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ top: number; left: number } | null>(null);
  
  // Invite Panel Toggle State
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);

  // Invite states
  const [inviteMessage, setInviteMessage] = useState("");
  const [existingInvitationWarning, setExistingInvitationWarning] = useState<boolean>(false);

  // Search State
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Reset focus index when suggestions list changes
  useEffect(() => {
      setFocusedIndex(-1);
  }, [userSuggestions]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const inputValue = form.watch("email");
  const [debouncedInput] = useDebounce(inputValue, 300);

  // Pagination Logic
  const meta = initialData?.meta || {
    page: 1,
    size: 10,
    totalPages: 1,
    totalElements: 0,
    numberOfElements: 0,
    first: true,
    last: true
  };

  const [invitations, setInvitations] = useState<OrganizationInvitation[]>(initialData?.contents || []);
  
  const canRevoke = check("invitation:write");

  const invitationStats = invitations.reduce(
    (acc, invitation) => {
      if (invitation.isAccepted) {
        acc.accepted += 1;
      } else if (invitation.isRevoked) {
        acc.revoked += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { pending: 0, accepted: 0, revoked: 0 }
  );

  useEffect(() => {
    setInvitations(initialData?.contents || []);
  }, [initialData]);

  // Handle click outside suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { mutate: revokeInvitation, isPending: isRevoking, variables: revokingId } = useMutation({
    mutationFn: async (invitationId: string) => {
        const res = await fetch(`/api/organizations/${organizationSlug}/invitations/${invitationId}/revoke`, {
            method: "PATCH",
        });
        
        const data = await res.json();

        if (!res.ok) {
            throw { status: res.status, data };
        }
        
        return data;
    },
    onSuccess: (_, invitationId) => {
        toast.success("Invitation revoked successfully");
        setInvitations(prev => prev.map(inv => 
             inv.id === invitationId ? { ...inv, isRevoked: true } : inv
        ));
        setInvitationToRevoke(null);
        router.refresh();
    },
    onError: (error: any, invitationId) => {
        console.error(error);
        const { status, data } = error;

        if (status === 400 && (data?.message?.includes("accepted") || data?.code === "ILLEGAL_ARGUMENT")) {
             toast.error("Cannot revoke: Invitation already accepted.");
             setInvitations(prev => prev.map(inv => 
                 inv.id === invitationId ? { ...inv, isAccepted: true } : inv
             ));
             router.refresh();
        } else {
            toast.error(data?.message || "Failed to revoke invitation");
        }
        setInvitationToRevoke(null);
    }
  });

  // User Search Effect
  useEffect(() => {
      const searchUsers = async () => {
          if (selectedUser) return; // Don't search if a user is selected

          // Check the current form value immediately to avoid searching with stale debounced value after reset
          const currentEmail = form.getValues("email");
          if (!currentEmail || currentEmail.length < 2) {
              setUserSuggestions([]);
              return;
          }

          if (!debouncedInput || debouncedInput.length < 2) {
              setUserSuggestions([]);
              return;
          }

          setIsSearchingUsers(true);
          try {
              const res = await fetch(`/api/users?query=${encodeURIComponent(debouncedInput)}`);
              if (res.ok) {
                  const data = await res.json();
                  const rawUsers = Array.isArray(data?.data?.contents) ? data.data.contents : [];
                  const users: UserSuggestion[] = rawUsers.map((u: any) => {
                      const firstName = u.firstName || "";
                      const lastName = u.lastName || "";
                      const name = (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || u.username || "");
                      return {
                          id: u.id || "",
                          username: u.username || "",
                          name: name,
                          email: u.email || "",
                          pictureUrl: u.pictureUrl || null,
                      };
                  });
                  
                  if (users.length > 0) {
                      // Fetch invitation statuses for these users
                      const emails = users.map(u => u.email).join(",");
                      const statusRes = await fetch(`/api/organizations/${organizationSlug}/invitations/statuses?emails=${encodeURIComponent(emails)}`);
                      
                      if (statusRes.ok) {
                          const statusData = await statusRes.json();
                          const statuses: InvitationStatus[] = statusData.data || [];
                          const statusMap = new Map(statuses.map(s => [s.email, s]));
                          
                          // Merge statuses
                          const enrichedUsers = users.map(u => ({
                              ...u,
                              invitationStatus: statusMap.get(u.email)
                          }));
                          
                          setUserSuggestions(enrichedUsers);
                      } else {
                          setUserSuggestions(users);
                      }
                  } else {
                      setUserSuggestions([]);
                  }
                  
                  setShowSuggestions(true);
              }
          } catch (error) {
              console.error("Search failed", error);
          } finally {
              setIsSearchingUsers(false);
          }
      };

      searchUsers();
  }, [debouncedInput, organizationSlug, selectedUser]);


  const selectUser = (user: UserSuggestion) => {
      // Don't select if user is already a member
      if (user.invitationStatus?.isAccepted || user.id === ownerId) {
          return; 
      }
      setSelectedUser(user);
      form.setValue("email", user.email, { shouldValidate: true });
      setShowSuggestions(false);
  };

  const clearSelectedUser = () => {
      setSelectedUser(null);
      form.setValue("email", "", { shouldValidate: false });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSizeChange = (newSize: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("size", newSize);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderPaginationButtons = () => {
    const totalPages = meta.totalPages;
    const currentPage = meta.page;
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('dots-1');
      }
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('dots-2');
      }
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (typeof page === 'string') {
        return (
          <Button
            key={`dots-${index}`}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 pointer-events-none"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        );
      }

      return (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Button>
      );
    });
  };

  // Dynamic state hooks for progressive inline flow
  const emailInputValue = form.watch("email");
  const isValidEmail = z.string().email().safeParse(emailInputValue).success;
  const showProgressiveStep = !!selectedUser || isValidEmail;

  useEffect(() => {
      let isMounted = true;
      const checkInvitationStatus = async () => {
          if (!showProgressiveStep) {
              setExistingInvitationWarning(false);
              return;
          }

          const targetEmail = selectedUser ? selectedUser.email : emailInputValue;
          if (!targetEmail || !z.string().email().safeParse(targetEmail).success) {
              setExistingInvitationWarning(false);
              return;
          }

          // If suggestion already contains status, use it
          if (selectedUser?.invitationStatus) {
              const status = selectedUser.invitationStatus;
              if (!status.isAccepted && !status.isRevoked) {
                  setExistingInvitationWarning(true);
              } else {
                  setExistingInvitationWarning(false);
              }
              return;
          }

          // Otherwise fetch from database
          try {
              const statusRes = await fetch(`/api/organizations/${organizationSlug}/invitations/statuses?emails=${encodeURIComponent(targetEmail)}`);
              if (statusRes.ok && isMounted) {
                  const statusData = await statusRes.json();
                  const statuses: InvitationStatus[] = statusData.data || [];
                  const status = statuses.find(s => s.email === targetEmail);
                  
                  if (status && !status.isAccepted && !status.isRevoked) {
                      setExistingInvitationWarning(true);
                  } else {
                      setExistingInvitationWarning(false);
                  }
              }
          } catch (e) {
              console.error("Failed to check invitation status", e);
              if (isMounted) setExistingInvitationWarning(false);
          }
      };

      checkInvitationStatus();
      return () => {
          isMounted = false;
      };
  }, [selectedUser, emailInputValue, showProgressiveStep, organizationSlug]);

  const sendInvite = async (data: InviteFormValues) => {
    const emailResult = z.string().email().safeParse(data.email);
    if (!emailResult.success) {
        toast.error("Please select a valid user or enter a valid email address.");
        return;
    }

    const existingUser = selectedUser || userSuggestions.find(u => u.email === data.email);
    if (existingUser?.invitationStatus?.isAccepted || existingUser?.id === ownerId) {
        toast.error("User is already a member of this organization.");
        return;
    }

    setStatus("sending");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/organizations/${organizationSlug}/invitations/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          message: inviteMessage.trim() === "" ? null : inviteMessage.trim(),
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Failed to send invitation");
      }

      setStatus("sent");
      toast.success(`Invitation sent to ${data.email}`);
      
      // Clear suggestions and selections
      setShowSuggestions(false);
      setUserSuggestions([]);
      setSelectedUser(null);
      setInviteMessage("");
      form.reset({ email: "" });
      
      router.refresh();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send invitation");
      setErrorMessage(err.message);
      setStatus("error");
    }
  };

  const resetInviteForm = () => {
      setSelectedUser(null);
      setInviteMessage("");
      setStatus("idle");
      setErrorMessage(null);
      form.reset({ email: "" });
      setShowSuggestions(false);
  };

  return (
    <div className="grid gap-6">
      <AnimatePresence initial={false}>
        {(isInvitePanelOpen && canInvite) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] pb-2">
              {/* Left Column: Form Card */}
              <Card className="h-full flex flex-col justify-between">
                <CardHeader>
                  <CardTitle>Invite Members</CardTitle>
                  <CardDescription>
                    Search for users by name, username or email to invite them to your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(sendInvite)} className="space-y-4 h-full flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 relative" ref={suggestionsRef}>
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem className="w-full text-left">
                                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email or Username</FormLabel>
                                <div className="rounded-xl border bg-muted/30 p-3 mt-1.5">
                                  <div className="relative w-full group">
                                    <AnimatePresence mode="wait">
                                      {selectedUser ? (
                                        <motion.div
                                          key="selected-recipient"
                                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                          className="w-full flex items-center justify-between p-3 bg-secondary/50 border border-primary/20 rounded-lg shadow-sm relative overflow-hidden group/card text-left"
                                        >
                                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                          
                                          <div className="flex items-center gap-3 relative z-10 overflow-hidden">
                                            <Avatar className="h-9 w-9 ring-2 ring-background shadow-xs shrink-0">
                                              <AvatarImage src={selectedUser.pictureUrl || `https://avatar.vercel.sh/${selectedUser.username}`} />
                                              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-bold text-[10px]">
                                                {selectedUser.username.substring(0,2).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col text-left overflow-hidden">
                                              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate">
                                                {selectedUser.name || selectedUser.username}
                                                <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4 bg-primary/10 text-primary border-none shrink-0 font-medium">
                                                  Recipient
                                                </Badge>
                                              </span>
                                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                                <AtSign className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{selectedUser.username}</span>
                                                <span className="mx-1 shrink-0">•</span>
                                                <span className="truncate">{selectedUser.email}</span>
                                              </span>
                                            </div>
                                          </div>
                                          
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm" 
                                                  className="h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors relative z-10 shrink-0 cursor-pointer"
                                                  onClick={(e) => {
                                                      e.preventDefault();
                                                      clearSelectedUser();
                                                  }}
                                                >
                                                  <X className="h-3.5 w-3.5" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Change Recipient</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </motion.div>
                                      ) : (
                                        <motion.div
                                          key="search-input"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="relative w-full group"
                                        >
                                          {isSearchingUsers ? (
                                            <Loader2 className="absolute left-3 top-3.5 h-4 w-4 animate-spin text-primary shrink-0" />
                                          ) : (
                                            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
                                          )}
                                          
                                          <FormControl>
                                            <Input 
                                              placeholder="Search by name, username or email..."
                                              className="h-11 pl-9 bg-background shadow-xs border-border/70 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200"
                                              autoComplete="off"
                                              role="combobox"
                                              aria-expanded={showSuggestions}
                                              aria-autocomplete="list"
                                              aria-controls="user-search-suggestions"
                                              aria-haspopup="listbox"
                                              aria-activedescendant={focusedIndex >= 0 ? `suggestion-item-${focusedIndex}` : undefined}
                                              {...field} 
                                              onFocus={() => {
                                                  if (userSuggestions.length > 0) setShowSuggestions(true);
                                              }}
                                              onKeyDown={(e) => {
                                                  if (userSuggestions.length === 0) {
                                                      if (e.key === "Enter" && field.value) {
                                                          return;
                                                      }
                                                      return;
                                                  }
                                                  
                                                  if (e.key === "ArrowDown") {
                                                      e.preventDefault();
                                                      setShowSuggestions(true);
                                                      setFocusedIndex((prev) => 
                                                          prev < userSuggestions.length - 1 ? prev + 1 : 0
                                                      );
                                                  } else if (e.key === "ArrowUp") {
                                                      e.preventDefault();
                                                      setShowSuggestions(true);
                                                      setFocusedIndex((prev) => 
                                                          prev > 0 ? prev - 1 : userSuggestions.length - 1
                                                      );
                                                  } else if (e.key === "Enter") {
                                                      if (showSuggestions && focusedIndex >= 0 && focusedIndex < userSuggestions.length) {
                                                          e.preventDefault();
                                                          const user = userSuggestions[focusedIndex];
                                                          selectUser(user);
                                                      }
                                                  } else if (e.key === "Escape") {
                                                      setShowSuggestions(false);
                                                  }
                                              }}
                                            />
                                          </FormControl>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                      {showSuggestions && !selectedUser && debouncedInput && debouncedInput.length >= 2 && (
                                        <motion.div 
                                          initial={{ opacity: 0, y: -8, scale: 0.99 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: -8, scale: 0.99 }}
                                          transition={{ duration: 0.15, ease: "easeOut" }}
                                          className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground rounded-lg border shadow-lg overflow-hidden"
                                        >
                                          <div 
                                              id="user-search-suggestions"
                                              role="listbox"
                                              aria-label="User search suggestions"
                                              className="max-h-[220px] overflow-y-auto p-1.5"
                                          >
                                              {userSuggestions.length > 0 ? (
                                                  <>
                                                      <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1">
                                                          Suggested Users · {userSuggestions.length}
                                                      </div>
                                                      {userSuggestions.map((user, index) => {
                                                          const isMember = user.invitationStatus?.isAccepted;
                                                          const isOwner = user.id === ownerId;
                                                          const isNotSelectable = isMember || isOwner;
                                                          
                                                          return (
                                                          <div
                                                              key={user.id}
                                                              id={`suggestion-item-${index}`}
                                                              role="option"
                                                              aria-selected={index === focusedIndex}
                                                              className={cn(
                                                                  "flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm outline-none transition-all duration-150 ease-in-out select-none text-left",
                                                                  isNotSelectable 
                                                                      ? "opacity-50 cursor-not-allowed bg-muted/30" 
                                                                      : index === focusedIndex
                                                                          ? "bg-accent text-accent-foreground scale-[1.01] shadow-xs"
                                                                          : "cursor-pointer hover:bg-accent/70 hover:scale-[1.01]"
                                                              )}
                                                              onClick={() => !isNotSelectable && selectUser(user)}
                                                              onMouseEnter={() => !isNotSelectable && setFocusedIndex(index)}
                                                          >
                                                              <Avatar className="h-8 w-8 shrink-0 shadow-xs">
                                                                  <AvatarImage src={user.pictureUrl || `https://avatar.vercel.sh/${user.username}`} />
                                                                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold text-xs">
                                                                      {user.username.substring(0,2).toUpperCase()}
                                                                  </AvatarFallback>
                                                              </Avatar>
                                                              <div className="flex flex-col overflow-hidden flex-1 text-left">
                                                                  <div className="flex items-center justify-between gap-2">
                                                                      <span className="font-semibold truncate text-foreground text-sm">{user.name || user.username}</span>
                                                                      {user.invitationStatus && !user.invitationStatus.isAccepted && !user.invitationStatus.isRevoked && (
                                                                          <Badge variant="outline" className="ml-2 text-[9px] font-medium h-4.5 px-1.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400">
                                                                              Invited
                                                                          </Badge>
                                                                      )}
                                                                       {isMember && (
                                                                          <Badge variant="outline" className="ml-2 text-[9px] font-medium h-4.5 px-1.5 bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400">
                                                                              Member
                                                                          </Badge>
                                                                      )}
                                                                      {isOwner && !isMember && (
                                                                          <Badge variant="outline" className="ml-2 text-[9px] font-medium h-4.5 px-1.5 bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400">
                                                                              Owner
                                                                          </Badge>
                                                                      )}
                                                                  </div>
                                                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate mt-0.5">
                                                                      <span className="flex items-center gap-0.5"><AtSign className="h-3 w-3 shrink-0" />{user.username}</span>
                                                                      <span>•</span>
                                                                      <span>{user.email}</span>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      )})}
                                                  </>
                                              ) : (
                                                  <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                                                      <div className="bg-muted p-2.5 rounded-full mb-2.5 text-muted-foreground shadow-inner">
                                                          <Search className="h-4 w-4" />
                                                      </div>
                                                      <p className="text-sm font-semibold text-foreground">No matches found</p>
                                                      <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
                                                          Press Enter to invite "{debouncedInput}" directly if it's a valid email.
                                                      </p>
                                                  </div>
                                              )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Step 2: Progressive disclosure for Message, Warnings & Action buttons */}
                        <AnimatePresence>
                          {showProgressiveStep && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden mt-4 pt-4 border-t border-border/40 space-y-4"
                            >
                              {existingInvitationWarning && (
                                <motion.div 
                                   initial={{ opacity: 0, y: -5 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   className="rounded-xl bg-amber-500/10 p-3.5 flex gap-3 text-sm text-amber-800 dark:text-amber-300 border border-amber-500/20 shadow-xs text-left"
                                >
                                   <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5 animate-bounce" />
                                   <div>
                                       <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Invitation Already Pending</p>
                                       <p className="mt-1 opacity-90 leading-relaxed text-xs">This user has already been invited. Sending another invitation will invalidate the previous invitation code and send a new link.</p>
                                   </div>
                                </motion.div>
                              )}

                              <div className="space-y-2 text-left">
                                <Label htmlFor="message-inline" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Invitation Message (Optional)</Label>
                                <Textarea 
                                    id="message-inline"
                                    placeholder="Introduce them to the organization..."
                                    maxLength={500}
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    className="resize-none h-24 border-border/80 focus-visible:ring-primary/20 bg-background shadow-xs transition-all duration-200 mt-1.5"
                                />
                                <div className="text-[11px] text-right text-muted-foreground mt-1">
                                    {inviteMessage.length}/500
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={resetInviteForm}
                                    disabled={status === "sending"}
                                    className="w-full sm:flex-1 h-10 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit"
                                    disabled={status === "sending"}
                                    className="w-full sm:flex-1 h-10 font-semibold shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                    {status === "sending" ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4 shrink-0" />
                                    )}
                                    Send Invitation
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Status Feedback */}
                      <div className="min-h-[50px] mt-4">
                         {status === "error" && errorMessage && (
                            <div className="rounded-xl bg-destructive/15 p-3.5 flex items-start gap-2.5 text-sm text-destructive border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
                                <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <p>{errorMessage}</p>
                            </div>
                         )}
                         
                         {status === "sent" && (
                              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 dark:bg-green-950/20 text-left">
                                 <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5 dark:text-green-400" />
                                 <div>
                                     <h4 className="font-semibold text-green-900 dark:text-green-200">Invitation Sent!</h4>
                                     <p className="text-sm text-green-700 mt-1 dark:text-green-300">
                                         An invitation email has been sent successfully.
                                     </p>
                                 </div>
                              </div>
                         )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Right Column: Live Email Preview Card */}
              <div className="h-full min-h-[420px]">
                {showProgressiveStep ? (
                  /* Active Live Preview State */
                  <div className="flex flex-col h-full border border-border/80 rounded-2xl bg-muted/20 overflow-hidden shadow-lg animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* Mock Email Client Window Header */}
                      <div className="bg-background/85 border-b border-border/60 px-4 py-2.5 flex items-center justify-between backdrop-blur-xs select-none">
                          <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-green-400/80 block" />
                          </div>
                          <Badge variant="outline" className="text-[10px] font-semibold py-0.5 px-2 bg-primary/5 text-primary border-primary/20 gap-1.5">
                              Live Preview
                          </Badge>
                      </div>

                      {/* Mock Header Fields */}
                      <div className="bg-background/40 px-4 py-3 border-b border-border/40 text-xs space-y-1.5 text-left text-muted-foreground">
                          <div><span className="font-semibold text-foreground/70">From:</span> Heapdog Security &lt;noreply@heapdog.com&gt;</div>
                          <div>
                              <span className="font-semibold text-foreground/70">To:</span>{" "}
                              <span className="text-primary font-semibold">
                                  {selectedUser 
                                      ? `${selectedUser.name || selectedUser.username} <${selectedUser.email}>` 
                                      : emailInputValue}
                              </span>
                          </div>
                          <div><span className="font-semibold text-foreground/70">Subject:</span> Invitation to join the {organizationSlug} organization on Heapdog</div>
                      </div>

                      {/* Mock Email Body Card */}
                      <div className="p-4 sm:p-6 bg-gradient-to-b from-background/30 to-background/50 flex-1 flex flex-col justify-center items-center">
                          <div className="w-full max-w-sm bg-card border border-border/60 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col items-center relative overflow-hidden group/mail">
                              {/* Subtle brand bar */}
                              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

                              {/* Overlapping Avatar Set */}
                              <div className="flex items-center justify-center relative w-20 h-12 mb-4">
                                  {/* Left Avatar: Inviter (Current User) */}
                                  <div className="absolute left-0 z-10 w-9 h-9 rounded-full ring-2 ring-background shadow-md overflow-hidden bg-muted">
                                      <Avatar className="h-full w-full">
                                          <AvatarImage src={`https://avatar.vercel.sh/${currentUser?.username || 'heapdog'}`} />
                                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-[9px]">
                                              {currentUser?.username?.substring(0, 2).toUpperCase() || "HD"}
                                          </AvatarFallback>
                                      </Avatar>
                                  </div>
                                  
                                  {/* Directional Connector Arrow */}
                                  <div className="w-8 h-[1px] bg-border relative z-0 flex items-center justify-center">
                                      <span className="absolute right-0 w-1 h-1 bg-border rounded-full" />
                                  </div>

                                  {/* Right Avatar: Organization */}
                                  <div className="absolute right-0 z-10 w-9 h-9 rounded-full ring-2 ring-background shadow-md flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-bold text-[10px]">
                                      {organizationSlug.substring(0, 2).toUpperCase()}
                                  </div>
                              </div>

                              {/* Main invitation context */}
                              <div className="text-center space-y-1.5 w-full">
                                  <h4 className="text-sm font-semibold text-foreground">
                                      {currentUser 
                                        ? (currentUser.first_name && currentUser.last_name 
                                           ? `${currentUser.first_name} ${currentUser.last_name}` 
                                           : currentUser.username) 
                                        : "An administrator"} invited you
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                      You've been invited to join the <span className="font-semibold text-foreground">{organizationSlug}</span> workspace on Heapdog.
                                  </p>
                              </div>

                              {/* Real-time sync message box */}
                              <div className="w-full mt-4 p-3 bg-muted/40 border border-border/50 rounded-lg text-left text-xs leading-relaxed relative min-h-[50px] flex items-center">
                                  <div className="text-muted-foreground italic w-full">
                                      {inviteMessage.trim() !== "" ? (
                                          <span className="text-foreground not-italic break-words">{inviteMessage}</span>
                                      ) : (
                                          <span>"Hello! I'd like to invite you to join our Heapdog organization to collaborate on our repositories, track security alerts, and manage codebases together."</span>
                                      )}
                                  </div>
                              </div>

                              {/* Mock CTA Button */}
                              <div className="w-full mt-5">
                                  <Button 
                                      className="w-full h-9 text-xs font-semibold shadow-xs bg-primary hover:bg-primary/95 text-primary-foreground pointer-events-none rounded-lg"
                                  >
                                      Join Organization
                                  </Button>
                              </div>

                              {/* Footer text */}
                              <div className="mt-5 text-[9px] text-muted-foreground text-center border-t border-border/40 pt-4 w-full space-y-0.5">
                                  <div>This invitation link was sent to <span className="font-medium">{selectedUser ? selectedUser.email : emailInputValue}</span>.</div>
                                  <div>It will expire in 7 days.</div>
                              </div>
                          </div>
                      </div>
                  </div>
                ) : (
                  /* Waiting for Recipient State */
                  <div className="flex flex-col items-center justify-center p-8 text-center min-h-[420px] h-full border border-dashed border-border/60 rounded-2xl bg-muted/10 relative overflow-hidden group">
                      {/* Background glowing gradient */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col items-center max-w-xs">
                          <div className="w-14 h-14 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4 shadow-xs group-hover:scale-105 transition-transform duration-300">
                              <Mail className="h-5 w-5 text-primary/70" />
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">Real-time Email Preview</h4>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                              Search for a user or enter a valid email to live-preview the invitation template in real-time.
                          </p>

                          {/* Quick tips list inside the preview helper */}
                          <div className="w-full mt-6 pt-6 border-t border-border/40 space-y-2.5 text-left text-[11px] text-muted-foreground">
                              <div className="flex items-start gap-2 bg-background/50 p-2.5 rounded-xl border border-border/20 shadow-2xs">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" />
                                  <span><strong>Revocable:</strong> Sent invitations are fully manageable and can be revoked instantly.</span>
                              </div>
                              <div className="flex items-start gap-2 bg-background/50 p-2.5 rounded-xl border border-border/20 shadow-2xs">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" />
                                  <span><strong>Secure:</strong> Invitation links are protected and expire after 7 days.</span>
                              </div>
                          </div>
                      </div>
                  </div>
                )}
              </div>   </div>
    </motion.div>
  )}
</AnimatePresence>

<Card>
          <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Manage invitations</CardTitle>
                  <CardDescription>
                      View and manage invitations.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50/80 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Pending {invitationStats.pending}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400">
                      Accepted {invitationStats.accepted}
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-400">
                      Revoked {invitationStats.revoked}
                    </Badge>
                  </div>
                  
                  {canInvite && (
                    <Button 
                      variant={isInvitePanelOpen ? "outline" : "default"}
                      onClick={() => setIsInvitePanelOpen(!isInvitePanelOpen)}
                      className="shadow-xs transition-all duration-200 gap-1.5 h-8.5 text-xs font-semibold px-4 cursor-pointer"
                      size="sm"
                    >
                      {isInvitePanelOpen ? (
                        <>
                          <X className="h-4 w-4" />
                          <span>Hide Form</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>Invite Member</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
          </CardHeader>
          <CardContent>
             <div className="border rounded-md">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>
                       <div className="flex items-center gap-2">
                         <Mail className="h-4 w-4" />
                         <span>Email</span>
                       </div>
                     </TableHead>
                     <TableHead>
                       <div className="flex items-center gap-2">
                         <Hash className="h-4 w-4" />
                         <span>Code</span>
                       </div>
                     </TableHead>
                     <TableHead>
                       <div className="flex items-center gap-2">
                         <Calendar className="h-4 w-4" />
                         <span>Sent Date</span>
                       </div>
                     </TableHead>
                     <TableHead>
                       <div className="flex items-center gap-2">
                         <Activity className="h-4 w-4" />
                         <span>Status</span>
                       </div>
                     </TableHead>
                     <TableHead className="text-right">Action</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {invitations.length > 0 ? (
                       invitations.map((invitation) => (
                         <TableRow key={invitation.id} className="hover:bg-muted/30 transition-colors duration-200 cursor-default">
                           <TableCell className="py-3">
                             <div 
                               className="flex items-center gap-3 relative group"
                               onMouseEnter={(e) => {
                                 if (invitation.user) {
                                   const rect = e.currentTarget.getBoundingClientRect();
                                   setHoveredInvitation(invitation);
                                   setHoveredCoords({
                                     top: rect.top,
                                     left: rect.left,
                                   });
                                 }
                               }}
                               onMouseLeave={() => {
                                 setHoveredInvitation(null);
                                 setHoveredCoords(null);
                               }}
                             >
                               <Avatar className="h-9 w-9 ring-1 ring-border shadow-xs shrink-0 cursor-help">
                                 <AvatarImage src={invitation.user?.pictureUrl || undefined} alt={invitation.email} />
                                 <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center">
                                   <UserIcon className="h-4 w-4" />
                                 </AvatarFallback>
                               </Avatar>
                               <div className="flex flex-col overflow-hidden text-left cursor-help">
                                 <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{invitation.email}</span>
                                 <span className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1.5 font-sans">
                                   <UserIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                   <span>Invited by</span>
                                   {invitation.createdBy ? (
                                     <span className="font-medium inline-flex items-center gap-1">
                                       {invitation.createdBy.pictureUrl ? (
                                         <img
                                           src={invitation.createdBy.pictureUrl}
                                           alt={invitation.createdBy.username}
                                           className="h-3.5 w-3.5 rounded-full object-cover shrink-0 select-none border border-zinc-200/50 dark:border-zinc-700/50"
                                         />
                                       ) : (
                                         <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 select-none shrink-0 border border-zinc-300 dark:border-zinc-700/60">
                                           <UserIcon className="h-[60%] w-[60%]" />
                                         </span>
                                       )}
                                       <span>
                                         {invitation.createdBy.firstName && invitation.createdBy.lastName 
                                           ? `${invitation.createdBy.firstName} ${invitation.createdBy.lastName}`
                                           : invitation.createdBy.username || "Unknown"
                                         }
                                       </span>
                                     </span>
                                   ) : (
                                     <span className="font-medium">Unknown</span>
                                   )}
                                 </span>
                               </div>
                             </div>
                           </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{invitation.invitationCode}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(invitation.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                             {invitation.isAccepted ? (
                                 <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 font-medium py-0 px-2 h-5.5">Accepted</Badge>
                             ) : invitation.isRevoked ? (
                                 <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20 font-medium py-0 px-2 h-5.5">Revoked</Badge>
                             ) : (
                                 <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 font-medium py-0 px-2 h-5.5">Pending</Badge>
                             )}
                          </TableCell>
                          <TableCell className="text-right">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted-foreground/10">
                                   <span className="sr-only">Open menu</span>
                                   <MoreHorizontal className="h-4.5 w-4.5" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-48">
                                 <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                 <DropdownMenuItem onClick={() => {
                                   navigator.clipboard.writeText(invitation.invitationCode);
                                   toast.success("Invitation code copied");
                                 }}>
                                   <Copy className="mr-2 h-4 w-4" />
                                   Copy Code
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => {
                                    const link = `${window.location.origin}/invitations/accept?code=${invitation.invitationCode}&org=${organizationSlug}`;
                                    navigator.clipboard.writeText(link);
                                    toast.success("Invitation link copied");
                                  }}>
                                   <Link className="mr-2 h-4 w-4" />
                                   Copy Invite Link
                                 </DropdownMenuItem>
                                 {!invitation.isAccepted && !invitation.isRevoked && canRevoke && (
                                   <>
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem 
                                       variant="destructive"
                                       onClick={() => setInvitationToRevoke(invitation)}
                                     >
                                       <Ban className="mr-2 h-4 w-4" />
                                       Revoke Invitation
                                     </DropdownMenuItem>
                                   </>
                                 )}
                               </DropdownMenuContent>
                             </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center p-6 space-y-3">
                            <div className="p-3 bg-muted rounded-full text-muted-foreground/75 shadow-xs">
                              <Mail className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground">No invitations sent yet</p>
                              <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                                Invite members to collaborate on your repositories, libraries, and problems.
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                 </TableBody>
               </Table>
             </div>

             {/* Pagination */}
             <div className="flex items-center justify-between py-4 space-x-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-muted-foreground hidden sm:block">Rows per page</p>
                <Select
                  value={meta.size.toString()}
                  onValueChange={handleSizeChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={meta.size.toString()} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 30, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                 <div className="text-sm text-muted-foreground mr-2 hidden sm:block">
                    Page {meta.page} of {meta.totalPages}
                 </div>
                 <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(meta.page - 1)}
                    disabled={meta.first}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="hidden md:flex items-center space-x-1">
                    {renderPaginationButtons()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(meta.page + 1)}
                    disabled={meta.last}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
              </div>
             </div>
          </CardContent>
      </Card>

      <AlertDialog open={!!invitationToRevoke} onOpenChange={(open) => !open && setInvitationToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation for <span className="font-medium">{invitationToRevoke?.email}</span>? 
              This action cannot be undone. The code sent to them will no longer be valid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (invitationToRevoke) {
                    revokeInvitation(invitationToRevoke.id);
                }
              }}
            >
              {isRevoking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  <Ban className="mr-2 h-4 w-4" />
              )}
              Revoke Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Portal-based Hover Card Popover (Guarantees no clipping by table overflow-hidden) */}
      {hoveredInvitation && hoveredCoords && hoveredInvitation.user && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed z-[9999] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-3 flex items-center gap-3 w-72 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: `${hoveredCoords.top - 68}px`,
            left: `${hoveredCoords.left}px`,
          }}
        >
          {hoveredInvitation.user.pictureUrl ? (
            <img
              src={hoveredInvitation.user.pictureUrl}
              alt={hoveredInvitation.user.username}
              className="h-10 w-10 rounded-full object-cover shrink-0 border border-violet-500/20 select-none animate-in fade-in duration-200"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-700/60 shadow-sm animate-in fade-in duration-200">
              <UserIcon className="h-5 w-5" />
            </div>
          )}
          <div className="space-y-0.5 min-w-0 flex-1 text-left font-sans">
            <div className="font-semibold text-xs text-white truncate">
              {hoveredInvitation.user.firstName && hoveredInvitation.user.lastName
                ? `${hoveredInvitation.user.firstName} ${hoveredInvitation.user.lastName}`
                : hoveredInvitation.user.username}
            </div>
            <div className="font-mono text-[10px] text-zinc-400 truncate">
              {hoveredInvitation.user.email}
            </div>
            <div className="font-mono text-[9px] text-zinc-500/80 truncate flex items-center gap-1 select-all pointer-events-auto">
              <span className="font-semibold select-none">UUID:</span>
              {hoveredInvitation.user.id}
            </div>
          </div>
          {/* Pointing Arrow */}
          <div className="absolute bottom-0 left-4 translate-y-[50%] w-2 h-2 rotate-45 bg-zinc-950 border-r border-b border-zinc-800" />
        </div>,
        document.body
      )}
    </div>
  );
}
