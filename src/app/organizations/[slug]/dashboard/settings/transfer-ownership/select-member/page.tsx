import { use } from "react";
import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { SelectMemberClient } from "./select-member-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SelectMemberPage({ params }: PageProps) {
  const user = await requireAuth();
  
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const organizations = await getUserOrganizations();
  const currentOrg = organizations.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  return (
    <SelectMemberClient slug={slug} currentUserId={user.id} />
  );
}
