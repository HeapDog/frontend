export interface Notification {
    id: number;
    message: string;
    link: string;
    read: boolean;
    clicked: boolean;
    type: "INVITATION" | "INFO" | "WARNING" | "ERROR";
    createdAt: string;
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
