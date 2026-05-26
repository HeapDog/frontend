import { BackendClient } from "@/lib/backend-client";
import { OrganizationInvitation, InvitationStatus, AcceptInvitationInfo, AcceptInvitationResponse } from "@/lib/types/organization";
import { PaginatedData } from "@/lib/types/api";

export async function fetchInvitationsWithCreators(
    slug: string, 
    page: number, 
    size: number, 
    token: string
): Promise<PaginatedData<OrganizationInvitation>> {
    const response = await BackendClient.get<PaginatedData<OrganizationInvitation>>(
      `/organizations/${slug}/invitations?page=${page}&size=${size}`,
      {
        headers: {
            Authorization: `Bearer ${token}`,
        }
      }
    );
    
    return response.data;
}

export async function fetchInvitationStatuses(
    slug: string,
    emails: string[],
    token: string
): Promise<InvitationStatus[]> {
    if (emails.length === 0) return [];

    const emailsParam = emails.map(e => encodeURIComponent(e)).join(",");
    const response = await BackendClient.get<InvitationStatus[]>(
        `/organizations/${slug}/invitations/statuses?emails=${emailsParam}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        }
    );

    return response.data;
}

export async function createInvitation(
    slug: string,
    email: string,
    message: string | null,
    token: string
): Promise<OrganizationInvitation> {
    const response = await BackendClient.post<OrganizationInvitation>(
        `/organizations/${slug}/invitations`,
        {
            email,
            message
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        }
    );
    return response.data;
}

export async function getAcceptInvitationInfo(
    slug: string,
    code: string,
    token: string
): Promise<AcceptInvitationInfo> {
    const response = await BackendClient.get<AcceptInvitationInfo>(
        `/organizations/${slug}/invitations/status?code=${code}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        }
    );
    return response.data;
}

export async function acceptInvitation(
    slug: string,
    code: string,
    token: string
): Promise<AcceptInvitationResponse> {
    // Note: The user specified GET for accepting, but normally state changes should be POST.
    // If the backend strictly requires GET, we use GET. 
    // The requirement says: "The spring's one is GET /api/v1/organizations/tservice/invitations/accept?code=fWCWz1"
    const response = await BackendClient.get<AcceptInvitationResponse>(
        `/organizations/${slug}/invitations/accept?code=${code}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        }
    );
    return response.data;
}
