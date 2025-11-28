import { requireUser } from "@/lib/auth";
import { CreateOrganizationForm } from "../create-organization-form";

export default async function CreateOrganizationPage() {
  await requireUser("/organizations/new");

  return (
    <div className="container mx-auto max-w-3xl py-10">
       <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
          <p className="text-muted-foreground">
            Establish a new organization to manage projects and collaborate with your team.
          </p>
        </div>
        <CreateOrganizationForm />
      </div>
    </div>
  );
}

