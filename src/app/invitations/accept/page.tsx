import { requireAuth } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/token-utils";
import { getAcceptInvitationInfo } from "@/lib/invitations";
import { AcceptInvitationView } from "@/components/invitations/accept-invitation-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { XCircle } from "lucide-react";

interface PageProps {
    searchParams: Promise<{ code?: string; org?: string }>;
}

export default async function InvitationAcceptPage({ searchParams }: PageProps) {
    const { code, org: slug } = await searchParams;
    
    // Ensure user is logged in
    await requireAuth();

    if (!code || !slug) {
        return <ErrorState title="Invalid Invitation Link" message="The invitation link is missing required information (code or organization)." />;
    }

    try {
        const token = await getValidAccessToken();
        if (!token) {
            return <ErrorState title="Unauthorized" message="Please sign in to accept the invitation." />;
        }

        const info = await getAcceptInvitationInfo(slug, code, token);
        return <AcceptInvitationView info={info} slug={slug} code={code} />;
    } catch (error: any) {
        const message = error?.message || "We couldn't find the invitation you're looking for.";
        const title = error?.status === 404 ? "Invitation Not Found" : 
                      error?.status === 400 ? "Invalid Invitation" : "Something went wrong";
        
        return <ErrorState title={title} message={message} />;
    }
}

function ErrorState({ title, message }: { title: string, message: string }) {
    return (
        <div className="container flex items-center justify-center min-h-[60vh] py-10">
             <Card className="w-full max-w-md border-destructive/20 shadow-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-xl text-destructive">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <p className="text-muted-foreground">{message}</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/organizations">Return to Organizations</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
