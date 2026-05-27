export type NotificationType = 
    | "INVITATION" 
    | "INFO" 
    | "WARNING" 
    | "ERROR" 
    | "INVITATION_ACCEPTED" 
    | "INVITATION_SENT"
    | "ORGANIZATION_MEMBER_ROLE_UPDATED"
    | "DEFAULT_ORGANIZATION_UPDATED";

export interface Notification {
    id: number;
    message: string;
    link: string;
    read: boolean;
    clicked: boolean;
    type: NotificationType;
    createdAt: string;
    userId?: string;
}

export interface NotificationEvent {
    timestamp: string;
    data: Notification;
    path: string;
}

export interface NotificationResponse {
    contents: Notification[];
    meta: {
        page: number;
        size: number;
        totalPages: number;
        totalElements: number;
        numberOfElements: number;
        first: boolean;
        last: boolean;
    };
}

export interface UnreadCountResponse {
    unread: number;
    total: number;
}
