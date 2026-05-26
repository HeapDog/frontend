"use client";

import { OrganizationMember } from "@/lib/types/organization";
import { PaginatedData } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    ChevronLeft, 
    ChevronRight, 
    MoreHorizontal, 
    MoreVertical,
    UserCog,
    AlertCircle,
    User,
    Check,
    Copy,
    Crown
} from "lucide-react";
import { useRouter, usePathname, useSearchParams, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMyPermissions } from "@/hooks/use-my-permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MembersViewProps {
  data: PaginatedData<OrganizationMember>;
  currentUserRole?: string;
  isPartial?: boolean;
  slug?: string;
  ownerId?: string;
}

function ChangeRoleDialog({ member, trigger }: { member: OrganizationMember; trigger?: React.ReactNode }) {
  const [role, setRole] = useState(member.role);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const handleSave = async () => {
    if (role === member.role) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/organizations/${slug}/membership/${member.membershipId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: role })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to update role");
      }

      toast.success("Role updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = ["ADMIN", "STAFF", "MEMBER"].filter(r => r !== member.role);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <UserCog className="h-4 w-4" />
            Change Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Select a new role for {member.username}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={role === member.role ? "" : role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder={member.role} />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || role === member.role}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const getRoleBadgeClasses = (role: string) => {
  const normalizedRole = role.toUpperCase();
  switch (normalizedRole) {
    case "ADMIN":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20";
    case "STAFF":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20";
    case "MEMBER":
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 ring-zinc-500/20";
  }
};

export function MembersView({ data, currentUserRole, isPartial, slug, ownerId }: MembersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { check } = useMyPermissions(slug || "");
  const canWriteMembers = check("member:write");
  
  const { contents: members, meta } = data;

  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const handleCopyUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid).then(() => {
      setCopiedUserId(uuid);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedUserId(null), 2000);
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  useEffect(() => {
    if (isPartial) {
        toast.error("Failed to load complete member details.", {
            description: "Some information might be missing due to a connection issue.",
            duration: 5000,
        });
    }
  }, [isPartial]);

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
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('dots-1');
      }

      // Calculate start and end of current range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if close to beginning
      if (currentPage <= 3) {
        end = 4;
      }
      
      // Adjust if close to end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('dots-2');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (typeof page === 'string') {
        return (
          <Button
            key={page}
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

  return (
    <Card className="flex flex-col h-[calc(100vh-280px)]">
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          Manage members of your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.pictureUrl || member.profilePictureUrl || undefined} alt={member.username} />
                      <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                     {member.detailsFetchFailed ? (
                        <div className="flex items-center space-x-2 text-muted-foreground/60">
                            <span>{member.username}</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Failed to load full user details</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2">
                          <span>{member.username}</span>
                          {member.id === ownerId && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20 uppercase tracking-wide select-none">
                                    <Crown className="h-3 w-3 text-amber-500 fill-amber-500/20 shrink-0 animate-pulse" />
                                    Owner
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Organization Creator & Owner
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                     )}
                  </TableCell>
                  <TableCell>
                    {member.detailsFetchFailed ? (
                        <span className="text-muted-foreground/60 italic">Not available</span>
                    ) : (
                        [member.firstName, member.lastName].filter(Boolean).join(" ") || "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {member.detailsFetchFailed ? (
                        <div className="flex items-center space-x-2 text-muted-foreground/60">
                            <span className="italic">Not available</span>
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Failed to load user email</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    ) : (
                        member.email
                    )}
                  </TableCell>
                  <TableCell>
                      <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", getRoleBadgeClasses(member.role))}>
                          {member.role}
                      </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleCopyUuid(member.id)}>
                          {copiedUserId === member.id ? (
                            <Check className="mr-2 h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="mr-2 h-4 w-4" />
                          )}
                          Copy User UUID
                        </DropdownMenuItem>
                        {canWriteMembers && (
                          <>
                            <DropdownMenuSeparator />
                            <ChangeRoleDialog
                              member={member}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <UserCog className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                              }
                            />
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No members found.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

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
                {[15, 30, 50, 100].map((pageSize) => (
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
  );
}
