import { requireUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
    await requireUser();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your organization settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
       <div className="py-4">
        <p className="text-sm text-muted-foreground italic">Settings coming soon...</p>
      </div>
      </CardContent>
    </Card>
  );
}
