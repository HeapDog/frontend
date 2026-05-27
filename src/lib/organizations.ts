import { BackendClient } from "./backend-client";
import { UserOrganization } from "./types/user";
import { getValidAccessToken } from "./token-utils";
import { PaginatedData } from "./types/api";
import { OrganizationBasicInfo, PublicOrganization } from "./types/organization";
import { getCurrentUser } from "./auth";

export async function getUserOrganizations(): Promise<UserOrganization[]> {
    try {
        const user = await getCurrentUser();
        return user?.organizations || [];
    } catch (error) {
        console.error("Error getting user organizations:", error);
        return [];
    }
}

export async function getOrganizationBasicInfo(slug: string, token: string): Promise<OrganizationBasicInfo | null> {
    try {
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
        console.error(`Error fetching basic info for ${slug}:`, error);
        return null;
    }
}

export async function getOrganizationBasicInfoServer(slug: string): Promise<OrganizationBasicInfo | null> {
    try {
        const token = await getValidAccessToken();
        if (!token) return null;

        const response = await BackendClient.get<OrganizationBasicInfo>(
            `/organizations/${slug}/basic-info`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            } as any
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching basic info for ${slug}:`, error);
        return null;
    }
}

export async function getPublicOrganization(slug: string): Promise<PublicOrganization | null> {
    try {
        const response = await BackendClient.get<PublicOrganization>(`/public/organizations/${slug}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching public organization ${slug}:`, error);
        return null;
    }
}
