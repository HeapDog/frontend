import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { BackendClient } from "@/lib/backend-client";
import { InternalUser, OrganizationBasicInfo } from "@/lib/types/organization";
import { BasicInfoView } from "./basic-info-view";
import { getValidAccessToken } from "@/lib/token-utils";
import { ErrorView } from "@/components/error-view";
import { ApiErrorResponse } from "@/lib/types/api";
import { InternalClient } from "@/lib/internal-client";
import { MyPermissionsResponse, hasPermission } from "@/lib/permissions";

async function getBasicInfo(slug: string) {
  try {
    const token = await getValidAccessToken();

    if (!token) throw new Error("Authentication required");

    const response = await BackendClient.get<OrganizationBasicInfo>(
      `/organizations/${slug}/basic-info`,
      {
        headers: {
            Authorization: `Bearer ${token}`,
        }
      }
    );
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error fetching basic info:", error);
    return { data: null, error };
  }
}

async function getInternalUsers(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, InternalUser>();

  const userIdsParam = userIds.map(id => encodeURIComponent(id)).join(",");
  const usersMap = new Map<string, InternalUser>();

  try {
    const response = await InternalClient.get<InternalUser[]>(
      `/internal/users?userIds=${userIdsParam}`
    );

    if (response.data) {
      response.data.forEach(user => usersMap.set(user.id, user));
    }
  } catch (error) {
    console.error("Failed to fetch internal users for basic info:", error);
  }

  return usersMap;
}

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams?: { mode?: string } | Promise<{ mode?: string }>;
}

export default async function BasicInfoPage({ params, searchParams }: PageProps) {
  const user = await requireAuth();
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const mode = resolvedSearchParams?.mode === "update" ? "update" : "view";
  
  // We need to fetch organizations to verify access, since they are not in the User object anymore
  const organizations = await getUserOrganizations();

  // Verify user access to this org slug
  const currentOrg = organizations.find(o => o.slug === slug);
  if (!currentOrg) {
      return (
           <div className="p-4 text-red-500">
              Error: You do not have access to this organization.
          </div>
      );
  }

  const token = await getValidAccessToken();

  if (mode === "update") {
    let hasWriteAccess = false;
    if (token) {
      try {
        const permissionsResponse = await BackendClient.get<MyPermissionsResponse>(
          `/organizations/${slug}/acl/my-permissions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        const permissions = permissionsResponse.data;
        if (permissions) {
          hasWriteAccess = hasPermission(permissions, "basic-info:write");
        }
      } catch (err) {
        console.error("Error checking write permissions:", err);
      }
    }

    if (!hasWriteAccess) {
      const forbiddenError: ApiErrorResponse = {
        timestamp: new Date().toISOString(),
        status: 403,
        error: "Forbidden",
        message: "You do not have permission to update basic information.",
        code: "ACCESS_DENIED",
        details: null,
        path: `/organizations/${slug}/dashboard/basic-info`
      };
      return (
        <div className="py-12">
          <ErrorView 
            error={forbiddenError}
            retryLink={`/organizations/${slug}/dashboard/basic-info`}
          />
        </div>
      );
    }
  }

  const { data: info, error } = await getBasicInfo(slug);

  if (error) {
      return (
          <ErrorView 
            error={error as ApiErrorResponse} 
            retryLink={`/organizations/${slug}/basic-info`}
          />
      );
  }

  if (!info) {
       return (
          <div className="p-4 text-muted-foreground">
              Failed to load organization information.
          </div>
      )
  }

  const userIds = Array.from(
    new Set([info.createdBy, info.updatedBy].filter((id): id is string => Boolean(id)))
  );
  const usersMap = await getInternalUsers(userIds);

  const enrichedInfo: OrganizationBasicInfo = {
    ...info,
    createdByUser: info.createdBy ? usersMap.get(info.createdBy) : undefined,
    updatedByUser: info.updatedBy ? usersMap.get(info.updatedBy) : undefined,
  };

  return <BasicInfoView info={enrichedInfo} userRole={currentOrg.role} mode={mode} />;
}
