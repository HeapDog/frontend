import { requireAuth } from "@/lib/auth";
import { getUserOrganizations, getOrganizationBasicInfo } from "@/lib/organizations";
import { BackendClient } from "@/lib/backend-client";
import { OrganizationMember, OrganizationMembership } from "@/lib/types/organization";
import { PaginatedData, ApiErrorResponse } from "@/lib/types/api";
import { MembersView } from "./members-view";
import { getValidAccessToken } from "@/lib/token-utils";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { ErrorView } from "@/components/error-view";

type GetMembersResult = 
  | { status: 'success'; data: PaginatedData<OrganizationMember> }
  | { status: 'error'; error: ApiErrorResponse | string };

async function getMembers(slug: string, page: number, size: number): Promise<GetMembersResult> {
  let token: string | undefined;
  
  try {
    token = await getValidAccessToken();

    if (!token) {
        return { status: 'error', error: "Authentication required" };
    }

    // 1. Fetch memberships using user's token (nested user profile is returned directly)
    const membershipResponse = await BackendClient.get<PaginatedData<OrganizationMembership>>(
      `/organizations/${slug}/memberships?page=${page}&size=${size}`,
      {
        headers: {
            Authorization: `Bearer ${token}`,
        }
      }
    );

    const membershipsData = membershipResponse.data;
    const memberships = membershipsData.contents || [];

    // 2. Map direct nested user profiles into OrganizationMember shape
    const members: OrganizationMember[] = memberships.map(m => ({
        id: m.userId,
        membershipId: m.membershipId,
        role: m.organizationRole,
        username: m.user?.username || "Unknown",
        email: m.user?.email || "",
        firstName: m.user?.firstName,
        lastName: m.user?.lastName,
        profilePictureUrl: m.user?.pictureUrl || m.user?.profilePictureUrl || null,
        pictureUrl: m.user?.pictureUrl || null
    }));

    return {
        status: 'success',
        data: {
            ...membershipsData,
            contents: members
        }
    };

  } catch (error) {
    console.error("Error fetching memberships (BackendClient):", error);
    return { status: 'error', error: error as ApiErrorResponse | string };
  }
}

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function MembersPage({ params, searchParams }: PageProps) {
  const user = await requireAuth();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;
  
  const page = Number(resolvedSearchParams.page) || 1;
  const size = Number(resolvedSearchParams.size) || 10;

  const organizations = await getUserOrganizations();

  // Verify user access to this org slug
  const hasAccess = organizations.some(o => o.slug === slug);
  if (!hasAccess) {
      return (
           <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Access Denied</h3>
                <p className="text-muted-foreground">
                  You do not have permission to view this organization's members.
                </p>
              </div>
          </div>
      );
  }

  const currentOrg = organizations.find(o => o.slug === slug);
  const currentRole = currentOrg?.role;

  const token = await getValidAccessToken();
  let basicInfo = null;
  if (token) {
    try {
      basicInfo = await getOrganizationBasicInfo(slug, token);
    } catch (e) {
      console.error("Failed to fetch organization basic info for members page", e);
    }
  }

  const result = await getMembers(slug, page, size);

  if (result.status === 'error') {
      return (
          <ErrorView 
            error={result.error} 
            retryLink={`/organizations/${slug}/dashboard/members`}
          />
      );
  }

  return (
    <Suspense fallback={<div>Loading members...</div>}>
      <MembersView 
        data={result.data} 
        currentUserRole={currentRole} 
        isPartial={false}
        slug={slug}
        ownerId={basicInfo?.owner?.id}
      />
    </Suspense>
  );
}
