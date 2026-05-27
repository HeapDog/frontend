"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AcceptInvitationInfo } from "@/lib/types/organization";

interface AcceptInvitationViewProps {
  info: AcceptInvitationInfo;
  slug: string;
  code: string;
}

export function AcceptInvitationView({ info, slug, code }: AcceptInvitationViewProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate: acceptInvitation, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, slug }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/organizations/${slug}/dashboard`);
        router.refresh();
      }, 3000);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to accept invitation");
    },
  });

  if (info.isRevoked) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh] py-10">
        <Card className="w-full max-w-md border-destructive/20 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-destructive"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
            </div>
            <CardTitle className="text-xl text-destructive">Invitation Revoked</CardTitle>
            <CardDescription>This invitation is no longer valid.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <a href="/organizations">Return to Organizations</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (info.isExpired) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh] py-10">
        <Card className="w-full max-w-md border-destructive/20 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-destructive"><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </div>
            <CardTitle className="text-xl text-destructive">Invitation Expired</CardTitle>
            <CardDescription>This invitation has expired. Please ask for a new one.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <a href="/organizations">Return to Organizations</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (info.isAccepted) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh] py-10">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <CardTitle className="text-2xl">Already Accepted</CardTitle>
            <CardDescription className="text-base">
              You have already joined <strong>{info.organization.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button asChild className="w-full" size="lg">
              <a href={`/organizations/${slug}/dashboard`}>Go to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh] py-10">
        <Card className="w-full max-w-md shadow-lg border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">Welcome Aboard!</CardTitle>
              <CardDescription className="text-green-700/80 dark:text-green-400/80 text-base">
                You have successfully joined <strong>{info.organization.name}</strong>.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center pb-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting to dashboard...</span>
            </div>
            <Button
              variant="outline"
              className="mt-4 border-green-200 hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:hover:bg-green-900/50 dark:hover:text-green-300"
              onClick={() => router.push(`/organizations/${slug}/dashboard`)}
            >
              Go to Dashboard Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-[60vh] py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Join Organization</CardTitle>
          <CardDescription className="text-base">You have been invited to join</CardDescription>
          <h3 className="text-xl font-bold text-foreground">{info.organization.name}</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          {info.message && (
            <div className="rounded-md bg-muted/50 p-4 text-center border transition-all">
              <div className={`text-sm text-muted-foreground ${isExpanded ? "max-h-60 overflow-y-auto" : "line-clamp-3"}`}>
                {info.message}
              </div>
              {info.message.length > 100 && (
                <Button variant="ghost" size="sm" className="w-full mt-2 h-6 hover:bg-transparent text-muted-foreground/70 hover:text-foreground" onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <Button className="w-full font-semibold" size="lg" onClick={() => acceptInvitation()} disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Joining...</> : "Join Organization"}
            </Button>
            <Button variant="outline" className="w-full" size="lg" asChild>
              <a href="/organizations">Cancel</a>
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground px-4">
            By accepting this invitation, you will be granted member access to the organization&apos;s workspace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
