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
}

export interface OrganizationInvitation {
    id: number;
    username: string; // The username of the inviter or the invitee? The JSON says "username": "parthokr", "email": "parthokr@gmail.com". It looks like the invitee's details if they exist, or maybe the inviter. Given "code" and "accepted", it's the invitation object.
    email: string;
    code: string;
    accepted: boolean;
    revoked: boolean;
    invitationDate: string;
}

