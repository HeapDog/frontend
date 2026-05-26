import { requireAuth } from "@/lib/auth";
import { getUserOrganizations, getOrganizationBasicInfo } from "@/lib/organizations";
import { fetchInvitationsWithCreators } from "@/lib/invitations";
import { InvitationsView } from "./invitations-view";
import { getValidAccessToken } from "@/lib/token-utils";
import { Suspense } from "react";
import { ErrorView } from "@/components/error-view";
import { ApiErrorResponse } from "@/lib/types/api";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function InvitationsPage({ params, searchParams }: PageProps) {
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
           <div className="p-4 text-red-500">
              Error: You do not have access to this organization.
          </div>
      );
  }

  const currentOrg = organizations.find(o => o.slug === slug);
  const role = currentOrg?.role;

  const token = await getValidAccessToken();
  
  let data = null;
  let basicInfo = null;
  let error = null;

  try {
      if (token) {
          const [invitationsData, basicInfoData] = await Promise.all([
              fetchInvitationsWithCreators(slug, page, size, token),
              getOrganizationBasicInfo(slug, token)
          ]);
          data = invitationsData;
          basicInfo = basicInfoData;
      }
  } catch (e) {
      console.error("Failed to fetch data", e);
      error = e;
  }

  if (error) {
       return (
          <ErrorView 
            error={error as ApiErrorResponse} 
            retryLink={`/organizations/${slug}/dashboard/members/invitations`}
          />
      );
  }

  return (
    <Suspense fallback={<div>Loading invitations...</div>}>
      <InvitationsView 
        organizationSlug={slug} 
        initialData={data} 
        currentUserRole={role}
        ownerId={basicInfo?.owner?.id}
        currentUser={user}
      />
    </Suspense>
  );
}
