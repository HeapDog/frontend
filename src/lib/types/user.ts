export interface OrganizationOwner {
    id: string;
    name: string;
    pictureUrl: string | null;
}

export interface UserOrganization {
    id: string;
    orgName: string;
    slug: string;
    role: string;
    membershipId: string;
    logoUrl?: string | null;
    owner?: OrganizationOwner | null;
}

export interface User {
    id: string;
    username: string;
    email: string;
    emailVerified?: boolean;
    currentOrganization?: {
        slug: string;
        role: string;
    };
    sub?: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
    organizations?: UserOrganization[];
}
