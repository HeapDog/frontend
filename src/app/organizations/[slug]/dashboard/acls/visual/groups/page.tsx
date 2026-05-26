import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { BackendClient } from "@/lib/backend-client";
import { getValidAccessToken } from "@/lib/token-utils";
import { GroupsView } from "./groups-view";
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

interface ApiGroup {
  name: string;
  type: string;
  size: number;
  users: ApiUser[];
}

export default async function GroupsPage({ params }: PageProps) {
  await requireAuth();
  const { slug } = await params;
  const organizations = await getUserOrganizations();
  const currentOrg = organizations?.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  // Fetch dynamic group policy configuration using user's identity via BackendClient
  let fetchedGroups: ApiGroup[] = [];
  let fetchedSuccessfully = false;
  let errorMessage = "";

  let errorObj: any = null;

  try {
    const token = await getValidAccessToken();
    if (token) {
      const response = await BackendClient.get<ApiGroup[]>(
        `/organizations/${slug}/acl/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      if (response?.data && Array.isArray(response.data)) {
        fetchedGroups = response.data;
        fetchedSuccessfully = true;
      }
    }
  } catch (error: any) {
    console.error("Error fetching ACL groups from backend:", error);
    errorMessage = error.message || "Failed to communicate with the access control service.";
    errorObj = error;
  }

  if (!fetchedSuccessfully) {
    return (
      <div className="py-12">
        <ErrorView 
          error={errorObj}
          title="Failed to Load Groups"
          message={errorMessage || "We could not synchronize with the access control backend. Please verify your connection or try again."}
          retryLink={`/organizations/${slug}/dashboard/acls/visual/groups`}
        />
      </div>
    );
  }

  const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const GROUP_DESCRIPTIONS: Record<string, string> = {
    "autogroup:admin": "Resolves dynamically to the Organization Owner and any user with the ADMIN role.",
    "autogroup:member": "Resolves dynamically to every active member of the organization.",
    "autogroup:staff": "Resolves dynamically to Heapdog platform administration and support staff.",
    "group:developer": "Engineering teams with permission to draft, publish, and test programming problems.",
    "group:reviewer": "Technical reviewers who review proposed problem updates and revisions.",
    "group:guest": "Temporary guest accounts and external recruiters who run candidate test assessments.",
    "group:billing-manager": "Finance and accounting administrators with access to invoices and subscription billing.",
    "group:auditor": "Security and compliance managers tracking organization event audits and system rules.",
  };

  const getGroupDescription = (name: string): string => {
    return GROUP_DESCRIPTIONS[name] || "Custom identity group mapping roles and permissions inside the organization.";
  };

  const groupsToRender = fetchedGroups.map((group) => {
    const typeLabel = group.type === "AUTOGROUP" ? "System Autogroup" : "Custom Group";
    const members = (group.users || []).map((user) => ({
      name: user.name || user.email || "Unknown User",
      email: user.email || "unknown@heapdog.io",
      initials: getInitials(user.name || user.email || "?"),
      pictureUrl: user.pictureUrl || null
    }));

    // For System autogroups with non-zero size but empty users list, add a dynamic indicator
    if (members.length === 0 && group.size > 0) {
      if (group.name === "autogroup:member") {
        members.push({
          name: "All Organization Members",
          email: "dynamically-resolved",
          initials: "OM",
          pictureUrl: null
        });
      } else {
        members.push({
          name: "Resolved Users",
          email: "dynamically-resolved",
          initials: "RU",
          pictureUrl: null
        });
      }
    }

    return {
      name: group.name,
      type: typeLabel,
      description: getGroupDescription(group.name),
      size: group.size,
      members: members
    };
  });

  return <GroupsView groups={groupsToRender} />;}
