import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MembersPermissionsSettingsPage() {
  await requireAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members & permissions</CardTitle>
        <CardDescription>Work in progress.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This section will manage member roles, permissions, and ownership.
      </CardContent>
    </Card>
  );
}
