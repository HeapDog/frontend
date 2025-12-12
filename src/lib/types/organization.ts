export interface Organization {
    id: number;
    name: string; // mapped from orgName in some contexts, but creating uses name
    slug: string;
    description?: string;
    email?: string;
    website?: string;
    address?: string;
    phone?: string;
    createdAt?: string;
    role?: string; // for the user's role in the org
}

export interface CreateOrganizationRequest {
    name: string;
    slug: string;
    description?: string;
    email?: string;
    website?: string;
    address?: string;
    phone?: string;
}

export interface OrganizationBasicInfo {
    id: number;
    name: string;
    slug: string;
    description: string;
    email: string;
    website: string;
    address: string;
    phone: string;
    createdAt: string;
}

export interface OrganizationMember {
    id: number;
    username: string;
    email: string;
    role: string;
    membershipId: number;
}

export interface OrganizationInvitation {
    id: number;
    username: string; // invitee's username
    email: string; // invitee's email
    code: string;
    accepted: boolean; // true if the invitation was accepted, false if it was revoked
    revoked: boolean; // true if the invitation was revoked, false if it was accepted
    invitationDate: string; // the date the invitation was sent 
}
