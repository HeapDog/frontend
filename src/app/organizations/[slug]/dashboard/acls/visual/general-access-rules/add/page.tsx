import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { AddRuleView } from "./add-rule-view";
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

interface ResourceRule {
  actions: string[];
  acceptsSelector: boolean;
}

interface AclMetadata {
  resources: string[];
  actions: string[];
  autogroups: string[];
  customGroups: string[];
  resourceRules: Record<string, ResourceRule>;
}

interface MetadataResponse {
  data: AclMetadata;
}

export default async function AddRulePage({ params }: PageProps) {
  await requireAuth();
  const { slug } = await params;
  const organizations = await getUserOrganizations();
  const currentOrg = organizations?.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  let acl: AclConfig | null = null;
  let users: Record<string, ApiUser> = {};
  let aclMetadata: AclMetadata | null = null;
  let fetchedSuccessfully = false;
  let errorMessage = "";
  let errorObj: any = null;

  try {
    const token = await getValidAccessToken();
    if (token) {
      // 1. Fetch current ACL
      const aclResponse = await BackendClient.get<AclDataResponse>(
        `/organizations/${slug}/acl`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // 2. Fetch ACL metadata
      const metadataResponse = await BackendClient.get<AclMetadata>(
        `/organizations/${slug}/acl/metadata`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (aclResponse?.data && aclResponse.data.acl && metadataResponse?.data) {
        acl = aclResponse.data.acl;
        users = aclResponse.data.users || {};
        aclMetadata = metadataResponse.data;
        fetchedSuccessfully = true;
      }
    }
  } catch (error: any) {
    console.error("Error fetching access metadata from backend:", error);
    errorMessage = error.message || "Failed to communicate with the access control service.";
    errorObj = error;
  }

  if (!fetchedSuccessfully || !acl || !aclMetadata) {
    return (
      <div className="py-12">
        <ErrorView 
          error={errorObj}
          title="Failed to Load Access Form"
          message={errorMessage || "We could not synchronize with the access control backend. Please verify your connection or try again."}
          retryLink={`/organizations/${slug}/dashboard/acls/visual/general-access-rules/add`}
        />
      </div>
    );
  }

  return (
    <AddRuleView 
      slug={slug} 
      initialAcl={acl} 
      users={users} 
      aclMetadata={aclMetadata} 
    />
  );
}
