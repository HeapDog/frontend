import { BackendClient } from "./backend-client";
import { User } from "./types/user";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const response = await BackendClient.get<User>("/auth/whoami", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireUser(returnUrl?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    let targetUrl = returnUrl;
    
    if (!targetUrl) {
      const headersList = await headers();
      targetUrl = headersList.get("x-url") || "/";
    }

    redirect(`/signin?redirect=${encodeURIComponent(targetUrl)}`);
  }

  return user;
}
