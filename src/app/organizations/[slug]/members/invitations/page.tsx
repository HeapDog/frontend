import { requireUser } from "@/lib/auth";
import { BackendClient } from "@/lib/backend-client";
import { OrganizationInvitation } from "@/lib/types/organization";
import { PaginatedData } from "@/lib/types/api";
import { InvitationsView } from "./invitations-view";
import { cookies } from "next/headers";

async function getInvitations(slug: string, page: number, size: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const response = await BackendClient.get<PaginatedData<OrganizationInvitation>>(
      `/organizations/${slug}/invitations?page=${page}&size=${size}`,
      {
        headers: {
            Authorization: `Bearer ${token}`,
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return null;
  }
}

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function InvitationsPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;
  
  const page = Number(resolvedSearchParams.page) || 1;
  const size = Number(resolvedSearchParams.size) || 10;

  // Verify user access to this org slug
  const hasAccess = user.organizations.some(o => o.slug === slug);
  if (!hasAccess) {
      return (
           <div className="p-4 text-red-500">
              Error: You do not have access to this organization.
          </div>
      );
  }

  const currentOrg = user.organizations.find(o => o.slug === slug);
  const role = currentOrg?.role;

  const data = await getInvitations(slug, page, size);

  return <InvitationsView organizationSlug={slug} initialData={data} currentUserRole={role} />;
}
