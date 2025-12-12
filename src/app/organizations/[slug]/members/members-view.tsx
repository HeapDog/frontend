"use client";

import { OrganizationMember } from "@/lib/types/organization";
import { PaginatedData } from "@/lib/types/api";
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
import { ChevronLeft, ChevronRight, MoreHorizontal, UserCog } from "lucide-react";
import { useRouter, usePathname, useSearchParams, useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface MembersViewProps {
  data: PaginatedData<OrganizationMember>;
  currentUserRole?: string;
}

function ChangeRoleDialog({ member }: { member: OrganizationMember }) {
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
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
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
        <Button variant="outline" size="sm" className="gap-2">
          <UserCog className="h-4 w-4" />
          Change Role
        </Button>
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

export function MembersView({ data, currentUserRole }: MembersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { contents: members, meta } = data;

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
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${member.username}`} alt={member.username} />
                      <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{member.username}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                          {member.role}
                      </span>
                  </TableCell>
                  <TableCell>
                    {currentUserRole === 'ADMIN' && (
                        <ChangeRoleDialog member={member} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
