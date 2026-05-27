import { User, UserOrganization } from "./types/user";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getValidAccessToken } from "@/lib/token-utils";
import { BackendClient } from "@/lib/backend-client";
import { cache } from "react";

interface BackendUserOrganization {
  organizationId: string;
  name: string;
  slug: string;
  role: string;
  logoUrl?: string | null;
  owner?: {
    id: string;
    name: string;
    pictureUrl: string | null;
  } | null;
}

interface BackendUserData {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  enabled: boolean;
  createdTimestamp: number;
  attributes?: string;
  roles?: string;
  defaultOrganizationId?: string;
  organizations: BackendUserOrganization[];
  pictureUrl?: string | null;
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    if (!sessionId) {
      return null;
    }

    // Ensure we have a valid access token (this will trigger refresh if needed)
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return null;
    }

    // Fetch live user info from the Spring Boot API
    const response = await BackendClient.get<BackendUserData>("/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    } as any);

    const backendUser = response.data;
    if (!backendUser || !backendUser.id) {
      return null;
    }

    let currentOrganization: { slug: string; role: string } | undefined;

    if (backendUser.defaultOrganizationId && backendUser.organizations) {
      const activeOrg = backendUser.organizations.find(
        (org) => org.organizationId === backendUser.defaultOrganizationId
      );
      if (activeOrg) {
        currentOrganization = {
          slug: activeOrg.slug,
          role: activeOrg.role,
        };
      }
    }

    const organizations: UserOrganization[] = backendUser.organizations?.map((org) => ({
      id: org.organizationId,
      orgName: org.name,
      slug: org.slug,
      role: org.role,
      membershipId: "",
      logoUrl: org.logoUrl || null,
      owner: org.owner ? {
        id: org.owner.id,
        name: org.owner.name,
        pictureUrl: org.owner.pictureUrl || null,
      } : null,
    })) || [];

    return {
      id: backendUser.id,
      sub: backendUser.id,
      email: backendUser.email || "",
      username: backendUser.username || "",
      first_name: backendUser.firstName,
      last_name: backendUser.lastName,
      profile_picture: backendUser.pictureUrl || undefined,
      currentOrganization,
      organizations,
    };

  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
});

export async function requireAuth(returnUrl?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const headersList = await headers();
    const acceptHeader = headersList.get("accept") || "";
    if (!acceptHeader.includes("text/html")) {
      throw new Response("Unauthorized", { status: 401 });
    }

    let targetUrl = returnUrl;
    if (!targetUrl) {
      targetUrl = headersList.get("x-url") || "/";
    }

    redirect(`/signin?next=${encodeURIComponent(targetUrl)}`);
  }

  return user;
}
