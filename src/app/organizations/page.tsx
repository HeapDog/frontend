import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function OrganizationsPage() {
  const user = await requireAuth();
  const organizations = await getUserOrganizations();

  if (organizations && organizations.length > 0) {
     const currentOrg = organizations.find(org => org.slug === user.currentOrganization?.slug) || organizations[0];
     // Redirect to the dynamic slug route
     redirect(`/organizations/${currentOrg.slug}/dashboard/basic-info`);
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">No Organization Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          You currently don't belong to any organization. Create one to get started with team collaboration.
        </p>
      </div>
      <Button asChild size="lg" className="gap-2">
        <Link href="/organizations/new">
          <Plus className="h-4 w-4" />
          Create Organization
        </Link>
      </Button>
    </div>
  );
}
