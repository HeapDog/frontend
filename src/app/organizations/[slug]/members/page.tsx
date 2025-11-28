import { requireUser } from "@/lib/auth";
import { BackendClient } from "@/lib/backend-client";
import { OrganizationMember } from "@/lib/types/organization";
import { PaginatedData } from "@/lib/types/api";
import { MembersView } from "./members-view";
import { cookies } from "next/headers";

async function getMembers(slug: string, page: number, size: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const response = await BackendClient.get<PaginatedData<OrganizationMember>>(
      `/organizations/${slug}/members?page=${page}&size=${size}`,
      {
        headers: {
            Authorization: `Bearer ${token}`,
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching members:", error);
    return null;
  }
}

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function MembersPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;
  
  const page = Number(resolvedSearchParams.page) || 1;
  const size = Number(resolvedSearchParams.size) || 30;

  // Verify user access to this org slug
  const hasAccess = user.organizations.some(o => o.slug === slug);
  if (!hasAccess) {
      return (
           <div className="p-4 text-red-500">
              Error: You do not have access to this organization.
          </div>
      );
  }

  const data = await getMembers(slug, page, size);

  if (!data) {
      return (
          <div className="p-4 text-muted-foreground">
              Failed to load members.
          </div>
      )
  }

  return <MembersView data={data} />;
}
