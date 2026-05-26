import { requireAuth } from "@/lib/auth";
import { CreateOrganizationForm } from "../create-organization-form";

export default async function CreateOrganizationPage() {
  await requireAuth("/organizations/new");

  return (
    <div className="container mx-auto py-6">
       <CreateOrganizationForm />
    </div>
  );
}
