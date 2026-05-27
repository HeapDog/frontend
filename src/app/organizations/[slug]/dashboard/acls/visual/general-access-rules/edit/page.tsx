import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { AddRuleView } from "../add/add-rule-view";
import { ErrorView } from "@/components/error-view";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; index?: string }>;
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

export default async function EditRulePage({ params, searchParams }: PageProps) {
  await requireAuth();
  const { slug } = await params;
  const { type, index } = await searchParams;

  const organizations = await getUserOrganizations();
  const currentOrg = organizations?.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  // Parse type and index
  const ruleType = type === "deny" ? "deny" : "grant";
  const ruleIndex = index ? parseInt(index, 10) : undefined;

  if (ruleIndex === undefined || isNaN(ruleIndex)) {
    redirect(`/organizations/${slug}/dashboard/acls/visual/general-access-rules`);
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
          retryLink={`/organizations/${slug}/dashboard/acls/visual/general-access-rules/edit?type=${ruleType}&index=${ruleIndex}`}
        />
      </div>
    );
  }

  // Double check that the rule exists at this index
  const rulesList = ruleType === "grant" ? acl.grants : acl.denies;
  if (!rulesList || !rulesList[ruleIndex]) {
    redirect(`/organizations/${slug}/dashboard/acls/visual/general-access-rules`);
  }

  return (
    <AddRuleView 
      slug={slug} 
      initialAcl={acl} 
      users={users} 
      aclMetadata={aclMetadata}
      mode="edit"
      ruleIndex={ruleIndex}
      ruleType={ruleType}
    />
  );
}
