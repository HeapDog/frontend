import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BillingSettingsPage() {
  await requireAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Work in progress.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This section will cover billing, plans, and invoices.
      </CardContent>
    </Card>
  );
}
