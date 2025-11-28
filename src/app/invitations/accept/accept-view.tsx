"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export interface AcceptInvitationInfo {
    organizationName: string;
    invitedEmail: string;
}

interface AcceptViewProps {
    info: AcceptInvitationInfo;
    slug: string;
    code: string;
}

export function AcceptView({ info, slug, code }: AcceptViewProps) {
    const router = useRouter();

    const { mutate: acceptInvitation, isPending } = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/invitations/accept", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code, slug }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw data;
            }

            return data;
        },
        onSuccess: () => {
            toast.success("Invitation accepted successfully!");
            router.push("/organizations");
            router.refresh();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to accept invitation");
        }
    });

    return (
        <div className="container flex items-center justify-center min-h-[60vh] py-10">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-primary"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" x2="19" y1="8" y2="14" />
                            <line x1="22" x2="16" y1="11" y2="11" />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl">Join Organization</CardTitle>
                    <CardDescription className="text-base">
                        You have been invited to join
                    </CardDescription>
                    <h3 className="text-xl font-bold text-foreground">{info.organizationName}</h3>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-md bg-muted/50 p-4 text-center border">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Invited as</p>
                        <p className="font-medium text-lg">{info.invitedEmail}</p>
                    </div>

                    <Button 
                        className="w-full font-semibold" 
                        size="lg" 
                        onClick={() => acceptInvitation()} 
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            "Join Organization"
                        )}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground px-4">
                        By accepting this invitation, you will be granted member access to the organization's workspace.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
