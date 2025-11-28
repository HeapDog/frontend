import { BackendClient } from "./backend-client";
import { NotificationResponse, UnreadCountResponse } from "./types";
import { cookies } from "next/headers";

export async function getNotifications(page: number = 1, size: number = 10): Promise<NotificationResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const response = await BackendClient.get<NotificationResponse>(`/notifications?page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return null;
  }
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { unread: 0, total: 0 };
    }

    const response = await BackendClient.get<UnreadCountResponse>("/notifications/unread-count", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data || { unread: 0, total: 0 };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { unread: 0, total: 0 };
  }
}
