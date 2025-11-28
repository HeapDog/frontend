export interface Organization {
    id: number;
    orgName: string;
    slug: string;
    role: string;
    membershipId: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: 'ROLE_USER' | 'ROLE_ADMIN';
    currentOrganizationId: number | null;
    organizations: Organization[];
}
