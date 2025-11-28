"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Send, Mail, User, ChevronLeft, ChevronRight, MoreHorizontal, Calendar, Hash, Activity, Ban } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "use-debounce";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OrganizationInvitation } from "@/lib/types/organization";

interface InvitationsViewProps {
  organizationSlug: string;
  initialData: PaginatedData<OrganizationInvitation> | null;
  currentUserRole?: string;
}

interface MembershipStatus {
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
  organization: {
    id: number;
    name: string;
    slug: string;
  };
  member: boolean;
  invited: boolean;
  memberSince: string | null;
}

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InvitationsView({ organizationSlug, initialData, currentUserRole }: InvitationsViewProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "checked" | "sending" | "sent" | "error">("idle");
  const [membershipInfo, setMembershipInfo] = useState<MembershipStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invitationToRevoke, setInvitationToRevoke] = useState<OrganizationInvitation | null>(null);
  
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

  const emailValue = form.watch("email");
  const [debouncedEmail] = useDebounce(emailValue, 500);

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
  
  const canRevoke = currentUserRole === "ADMIN";

  useEffect(() => {
    setInvitations(initialData?.contents || []);
  }, [initialData]);

  const { mutate: revokeInvitation, isPending: isRevoking, variables: revokingId } = useMutation({
    mutationFn: async (invitationId: number) => {
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
             inv.id === invitationId ? { ...inv, revoked: true } : inv
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
                 inv.id === invitationId ? { ...inv, accepted: true } : inv
             ));
             router.refresh();
        } else {
            toast.error(data?.message || "Failed to revoke invitation");
        }
        setInvitationToRevoke(null);
    }
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSizeChange = (newSize: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("size", newSize);
    params.set("page", "1"); // Reset to page 1 when size changes
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

  useEffect(() => {
    const checkMembership = async () => {
      const emailResult = inviteSchema.safeParse({ email: debouncedEmail });
      
      if (!debouncedEmail || !emailResult.success) {
        if (status !== "idle" && status !== "sent") {
            setStatus("idle");
            setMembershipInfo(null);
            setErrorMessage(null);
        }
        return;
      }

      setStatus("checking");
      setErrorMessage(null);
      setMembershipInfo(null);

      try {
        const res = await fetch(`/api/organizations/${organizationSlug}/membership-status?email=${encodeURIComponent(debouncedEmail)}`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to check membership status");
        }

        setMembershipInfo(data.data);
        setStatus("checked");
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "An error occurred while checking membership.");
        setStatus("error");
      }
    };

    checkMembership();
  }, [debouncedEmail, organizationSlug]);

  useEffect(() => {
    if (status === "sent" || status === "error" || (status === "checked" && membershipInfo?.user?.email !== emailValue)) {
        if (emailValue !== debouncedEmail) {
             if (status === "sent") {
                 setStatus("idle");
                 setMembershipInfo(null);
             }
        }
    }
  }, [emailValue, debouncedEmail, status, membershipInfo]);


  const sendInvite = async (data: InviteFormValues) => {
    setStatus("sending");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/organizations/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: data.email,
          organizationSlug: organizationSlug,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Failed to send invitation");
      }

      setStatus("sent");
      toast.success(`Invitation sent to ${data.email}`);
      form.reset({ email: "" });
      
      // Refresh the page to show the new invitation
      router.refresh();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send invitation");
      setErrorMessage(err.message);
      setStatus("checked"); 
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite Members</CardTitle>
          <CardDescription>
            Invite new members to your organization by email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(sendInvite)} className="space-y-4 max-w-xl">
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Email Address</FormLabel>
                      <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input 
                                placeholder="colleague@company.com" 
                                className="pl-9"
                                {...field} 
                                />
                            </FormControl>
                             {status === "checking" && (
                                <div className="absolute right-3 top-2.5">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                          </div>
                          <Button 
                              type="submit" 
                              disabled={status === "sending" || status === "checking" || status !== "checked" || (membershipInfo?.member ?? true) || (membershipInfo?.invited ?? false)}
                              className="w-40 shrink-0"
                          >
                               {status === "sending" ? (
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                               ) : (
                                   <Send className="mr-2 h-4 w-4" />
                               )}
                              Send Invite
                          </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>

          <div className="mt-4 min-h-[100px] max-w-xl">
             {/* Status Feedback */}
             {status === "error" && errorMessage && (
                <div className="rounded-md bg-destructive/15 p-3 flex items-start gap-2 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <p>{errorMessage}</p>
                </div>
             )}

             {status === "checked" && membershipInfo && (
                <div className={`rounded-lg border p-4 animate-in fade-in slide-in-from-top-2 duration-300 ${
                    membershipInfo.member 
                        ? "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/10 dark:border-yellow-900/30" 
                        : membershipInfo.invited
                        ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/30"
                        : "bg-green-50/50 border-green-200 dark:bg-green-950/10 dark:border-green-900/30"
                }`}>
                    <div className="flex items-start gap-4">
                         {membershipInfo.member ? (
                             <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                             </div>
                         ) : membershipInfo.invited ? (
                             <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full shrink-0">
                                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                             </div>
                         ) : (
                             <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                             </div>
                         )}
                         <div className="space-y-1 flex-1">
                             <h4 className={`font-semibold ${
                                membershipInfo.member 
                                    ? "text-yellow-900 dark:text-yellow-200" 
                                    : membershipInfo.invited
                                    ? "text-blue-900 dark:text-blue-200"
                                    : "text-green-900 dark:text-green-200"
                             }`}>
                                {membershipInfo.member 
                                    ? "User is already a member" 
                                    : membershipInfo.invited 
                                    ? "Invitation already sent"
                                    : "User is available to invite"}
                             </h4>
                             <p className="text-sm text-muted-foreground">
                                {membershipInfo.member 
                                    ? "This user is already part of your organization." 
                                    : membershipInfo.invited
                                    ? "An invitation is already pending for this user."
                                    : "User not found in the system. An invitation will be sent to this email address."}
                             </p>
                             
                             {membershipInfo.user && (
                                 <div className="mt-3 flex items-center gap-3 bg-background/80 p-3 rounded-md border border-border/50 shadow-sm">
                                     <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                         <User className="h-4 w-4 text-primary" />
                                     </div>
                                     <div className="min-w-0">
                                         <p className="text-sm font-medium truncate">{membershipInfo.user.username}</p>
                                         <p className="text-xs text-muted-foreground truncate">{membershipInfo.user.email}</p>
                                     </div>
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
             )}
             
             {status === "sent" && (
                  <div className="rounded-md bg-green-50/50 border border-green-200 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                     <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                     <div>
                         <h4 className="font-medium text-green-900">Invitation Sent!</h4>
                         <p className="text-sm text-green-700 mt-1">
                             An invitation email has been sent successfully.
                         </p>
                     </div>
                  </div>
             )}
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Manage invitations</CardTitle>
              <CardDescription>
                  View and manage invitations.
              </CardDescription>
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
                       <TableRow key={invitation.id}>
                         <TableCell>{invitation.email}</TableCell>
                         <TableCell className="font-mono text-xs">{invitation.code}</TableCell>
                         <TableCell>{new Date(invitation.invitationDate).toLocaleDateString()}</TableCell>
                         <TableCell>
                            {invitation.accepted ? (
                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Accepted</span>
                            ) : invitation.revoked ? (
                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Revoked</span>
                            ) : (
                                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Pending</span>
                            )}
                         </TableCell>
                         <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block" tabIndex={0}>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className={canRevoke ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground opacity-50 cursor-not-allowed"}
                                        disabled={!canRevoke || invitation.accepted || invitation.revoked || (isRevoking && revokingId === invitation.id)}
                                        onClick={() => canRevoke && setInvitationToRevoke(invitation)}
                                        title={!canRevoke ? "You do not have permission to revoke invitations" : "Revoke Invitation"}
                                    >
                                        {isRevoking && revokingId === invitation.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Ban className="h-4 w-4 mr-2" />
                                        )}
                                        Revoke
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!canRevoke && (
                                    <TooltipContent>
                                        <p>You do not have permission to revoke invitations.</p>
                                    </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                         </TableCell>
                       </TableRow>
                     ))
                   ) : (
                     <TableRow>
                       <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                         No invitations found.
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
              className="bg-destructive text-white hover:bg-destructive/90"
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
    </div>
  );
}
