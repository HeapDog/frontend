export interface Organization {
    id: string;
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
    createdAt?: string;
}

import { OrganizationOwner } from "./user";

export interface PublicOrganization {
    slug: string;
    name: string;
    description: string | null;
    website: string | null;
    websiteStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
    email: string | null;
    phone: string | null;
    address: string | null;
    logoUrl?: string | null;
    owner?: OrganizationOwner | null;
    memberCount: number;
    createdAt: string;
}

export interface OrganizationBasicInfo {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    email: string | null;
    website: string | null;
    websiteStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
    address: string | null;
    phone: string | null;
    logoUrl?: string | null;
    owner?: OrganizationOwner | null;
    defaultProblemLibraryId?: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
    createdByUser?: InternalUser;
    updatedByUser?: InternalUser;
}

export interface OrganizationWebsiteVerification {
    id: string;
    address: string | null;
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
    verificationCode: string | null;
    lastCheckedAt: string | null;
    verifiedAt: string | null;
    nextCheckAt: string | null;
}

export interface OrganizationMembership {
    membershipId: string;
    userId: string;
    organizationRole: string;
    joinedAt?: string;
    user?: {
        id: string;
        username: string;
        email: string;
        firstName?: string;
        lastName?: string;
        profilePictureUrl?: string | null;
        pictureUrl?: string | null;
    };
}

export interface InternalUser {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string | null;
}

export interface OrganizationMember {
    id: string; // userId
    username: string;
    email: string;
    role: string;
    membershipId: string;
    firstName?: string;
    lastName?: string;
    detailsFetchFailed?: boolean;
    profilePictureUrl?: string | null;
    pictureUrl?: string | null;
}

export interface OrganizationInvitation {
    id: string;
    invitationCode: string;
    email: string;
    isAccepted: boolean;
    isRevoked: boolean;
    createdAt: string;
    createdBy?: {
        id: string;
        username: string;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        pictureUrl?: string | null;
    } | null;
    user?: {
        id: string;
        username: string;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        pictureUrl?: string | null;
    } | null;
}

export interface InvitationStatus {
    id: string;
    email: string;
    isAccepted: boolean;
    isRevoked: boolean;
}

export interface AcceptInvitationInfo {
    isAccepted: boolean;
    isRevoked: boolean;
    isExpired: boolean;
    organization: {
        id: string;
        name: string;
    };
    message?: string;
}

export interface AcceptInvitationResponse {
    membershipId: string;
    organizationId: string;
    organizationSlug: string;
    role: string;
}
