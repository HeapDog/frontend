import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { GeneralAccessRulesView } from "./general-access-rules-view";
import { ErrorView } from "@/components/error-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  pictureUrl?: string | null;
}

interface AclRule {
  who: string[];
  permissions: string[];
}

interface AclConfig {
  groups: Record<string, string[]>;
  grants: AclRule[];
  denies: AclRule[];
}

interface AclDataResponse {
  acl: AclConfig;
  users: Record<string, ApiUser>;
}

export default async function GeneralAccessRulesPage({ params }: PageProps) {
  await requireAuth();
  const { slug } = await params;
  const organizations = await getUserOrganizations();
  const currentOrg = organizations?.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  // Fetch active authorization policy using user's identity via BackendClient
  let grants: AclRule[] = [];
  let denies: AclRule[] = [];
  let fetchedUsers: Record<string, ApiUser> = {};
  let fetchedSuccessfully = false;
  let errorMessage = "";

  const resolveWho = (whoList: string[], users: Record<string, ApiUser>) => {
    return whoList.map((whoItem) => {
      if (whoItem.startsWith("uuid:")) {
        const uuid = whoItem.substring(5);
        const user = users[uuid];
        if (user && user.email) {
          return `email:${user.email}`;
        }
      }
      return whoItem;
    });
  };

  let errorObj: any = null;

  try {
    const token = await getValidAccessToken();
    if (token) {
      const response = await BackendClient.get<AclDataResponse>(
        `/organizations/${slug}/acl`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      if (response?.data && response.data.acl) {
        const acl = response.data.acl;
        fetchedUsers = response.data.users || {};
        
        grants = (acl.grants || []).map((rule) => ({
          who: resolveWho(rule.who || [], fetchedUsers),
          permissions: rule.permissions || []
        }));

        denies = (acl.denies || []).map((rule) => ({
          who: resolveWho(rule.who || [], fetchedUsers),
          permissions: rule.permissions || []
        }));

        fetchedSuccessfully = true;
      }
    }
  } catch (error: any) {
    console.error("Error fetching access rules from backend:", error);
    errorMessage = error.message || "Failed to communicate with the access control service.";
    errorObj = error;
  }

  if (!fetchedSuccessfully) {
    return (
      <div className="py-12">
        <ErrorView 
          error={errorObj}
          title="Failed to Load Access Rules"
          message={errorMessage || "We could not synchronize with the access control backend. Please verify your connection or try again."}
          retryLink={`/organizations/${slug}/dashboard/acls/visual/general-access-rules`}
        />
      </div>
    );
  }

  return (
    <GeneralAccessRulesView 
      slug={slug} 
      grants={grants} 
      denies={denies} 
      users={fetchedUsers}
    />
  );
}
