import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { DangerZoneView } from "./danger-zone-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DangerZoneSettingsPage({ params }: PageProps) {
  await requireAuth();
  
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const organizations = await getUserOrganizations();
  const currentOrg = organizations.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  return (
    <div className="py-6">
      <DangerZoneView slug={slug} orgName={currentOrg.orgName} />
    </div>
  );
}
