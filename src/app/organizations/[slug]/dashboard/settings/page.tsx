import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  await requireAuth();
  const { slug } = await params;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Organization settings</h1>
        <p className="text-muted-foreground text-lg">
          Choose a section from the left to configure your organization.
        </p>
      </div>
      <Separator className="opacity-50" />
      <Card>
        <CardHeader>
          <CardTitle>Settings overview</CardTitle>
          <CardDescription>Settings sections are available in the sidebar.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select Website Verification, Integrations, Billing, or Danger Zone to continue.
        </CardContent>
      </Card>
    </div>
  );
}
