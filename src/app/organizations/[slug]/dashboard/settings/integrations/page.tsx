import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function IntegrationsSettingsPage() {
  await requireAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Work in progress.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This section will manage external integrations and API connections.
      </CardContent>
    </Card>
  );
}
