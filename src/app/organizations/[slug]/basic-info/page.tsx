import { requireUser } from "@/lib/auth";
import { BackendClient } from "@/lib/backend-client";
import { OrganizationBasicInfo } from "@/lib/types/organization";
import { BasicInfoView } from "./basic-info-view";
import { cookies } from "next/headers";

async function getBasicInfo(slug: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const response = await BackendClient.get<OrganizationBasicInfo>(
      `/organizations/${slug}/basic-info`,
      {
        headers: {
            Authorization: `Bearer ${token}`,
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching basic info:", error);
    return null;
  }
}

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function BasicInfoPage({ params }: PageProps) {
  const user = await requireUser();
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Verify user access to this org slug
  const currentOrg = user.organizations.find(o => o.slug === slug);
  if (!currentOrg) {
      return (
           <div className="p-4 text-red-500">
              Error: You do not have access to this organization.
          </div>
      );
  }

  const info = await getBasicInfo(slug);

  if (!info) {
      return (
          <div className="p-4 text-muted-foreground">
              Failed to load organization information.
          </div>
      )
  }

  return <BasicInfoView info={info} userRole={currentOrg.role} />;
}
