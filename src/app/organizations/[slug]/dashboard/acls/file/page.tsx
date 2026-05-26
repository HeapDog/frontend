import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { FileEditorView } from "./file-editor-view";
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

export default async function AclFilePage({ params }: PageProps) {
  await requireAuth();
  const { slug } = await params;
  const organizations = await getUserOrganizations();
  const currentOrg = organizations?.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  // Fetch active authorization policy from backend
  let fetchedAcl: AclConfig | null = null;
  let fetchedUsers: Record<string, ApiUser> = {};
  let fetchedSuccessfully = false;
  let errorMessage = "";
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
        fetchedAcl = response.data.acl;
        fetchedUsers = response.data.users || {};
        fetchedSuccessfully = true;
      }
    }
  } catch (error: any) {
    console.error("Error fetching policy file from backend:", error);
    errorMessage = error.message || "Failed to communicate with the access control service.";
    errorObj = error;
  }

  if (!fetchedSuccessfully || !fetchedAcl) {
    return (
      <div className="py-12">
        <ErrorView 
          error={errorObj}
          title="Failed to Load Policy File"
          message={errorMessage || "We could not synchronize with the access control backend. Please verify your connection or try again."}
          retryLink={`/organizations/${slug}/dashboard/acls/file`}
        />
      </div>
    );
  }

  return (
    <FileEditorView 
      initialAcl={fetchedAcl} 
      users={fetchedUsers}
      slug={slug} 
    />
  );
}
