import { ApiErrorResponse, ApiResponse } from "./types/api";
import { serviceTokenManager } from "./service-token-manager";

const BASE_URL = process.env.SPRING_BOOT_API_URL || "http://localhost:8080";

interface FetchOptions extends RequestInit {
    body?: any;
}

export class InternalClient {
    private static async getServiceToken() {
        return await serviceTokenManager.getAccessToken();
    }

    static async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
        console.log("Fetching internal API:", endpoint);
        const url = `${BASE_URL}${endpoint}`;
        
        // Get initial token
        let token = await this.getServiceToken();

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers,
        };

        const config: RequestInit = {
            ...options,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        };

        try {
            let res = await fetch(url, config);

            // Handle 401 Unauthorized - Refresh Service Token
            if (res.status === 401) {
                console.log("Received 401 from internal API, attempting to refresh service token...");
                // Force refresh by invalidating cache and getting a new token
                serviceTokenManager.invalidateToken();
                token = await this.getServiceToken();
                
                // Retry the request with the new token
                const retryHeaders = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    ...options.headers,
                };
                const retryConfig: RequestInit = {
                    ...options,
                    headers: retryHeaders,
                    body: options.body ? JSON.stringify(options.body) : undefined,
                };
                res = await fetch(url, retryConfig);
            }
            
            // Handle empty response body
            const text = await res.text();
            let data;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                 console.error("Failed to parse JSON response:", text);
                 throw new Error("Invalid JSON response from server");
            }

            if (!res.ok) {
                if (data) {
                     throw data as ApiErrorResponse;
                }
                 throw {
                    timestamp: new Date().toISOString(),
                    status: res.status,
                    error: res.statusText,
                    code: "HTTP_ERROR",
                    message: text || "Unknown error occurred",
                    details: null,
                    path: endpoint,
                } as ApiErrorResponse;
            }

            return data as ApiResponse<T>;
        } catch (error) {
             // If it's already our structured error, rethrow
            if ((error as any).status && (error as any).error) {
                throw error;
            }

            let errorMessage = "An unknown error occurred";
            if (error instanceof Error) {
                if (error.message === "fetch failed") {
                    errorMessage = "Network error: Unable to reach the internal backend service.";
                } else {
                    errorMessage = error.message;
                }
            }

            console.error("Internal API fetch error:", error);
            throw {
                timestamp: new Date().toISOString(),
                status: 500,
                error: "Internal Server Error",
                code: "INTERNAL_ERROR",
                message: errorMessage,
                details: null,
                path: endpoint,
            } as ApiErrorResponse;
        }
    }

    static async post<T>(endpoint: string, body: any, options: Omit<FetchOptions, "body"> = {}): Promise<ApiResponse<T>> {
        return this.fetch<T>(endpoint, { ...options, method: "POST", body });
    }

    static async get<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
        return this.fetch<T>(endpoint, { ...options, method: "GET" });
    }

    static async put<T>(endpoint: string, body: any, options: Omit<FetchOptions, "body"> = {}): Promise<ApiResponse<T>> {
        return this.fetch<T>(endpoint, { ...options, method: "PUT", body });
    }

    static async patch<T>(endpoint: string, body: any, options: Omit<FetchOptions, "body"> = {}): Promise<ApiResponse<T>> {
        return this.fetch<T>(endpoint, { ...options, method: "PATCH", body });
    }

    static async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
        return this.fetch<T>(endpoint, { ...options, method: "DELETE" });
    }
}

