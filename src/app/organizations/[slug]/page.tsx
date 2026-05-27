import { getPublicOrganization } from "@/lib/organizations";
import { notFound } from "next/navigation";
import { PublicOrgView } from "./public-org-view";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const organization = await getPublicOrganization(slug);

  if (!organization) {
    return {
      title: "Organization Not Found",
    };
  }

  return {
    title: `${organization.name} | HeapDog`,
    description: organization.description || `View ${organization.name}'s public profile on HeapDog`,
    openGraph: {
      title: organization.name,
      description: organization.description || `View ${organization.name}'s public profile`,
      type: "profile",
    },
  };
}

export default async function PublicOrganizationPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const organization = await getPublicOrganization(slug);

  if (!organization) {
    notFound();
  }

  return <PublicOrgView organization={organization} />;
}
