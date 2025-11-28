import { ApiErrorResponse, ApiResponse } from "./types/api";

const BASE_URL = process.env.SPRING_BOOT_API_URL || "http://localhost:8080";

interface FetchOptions extends RequestInit {
    body?: any;
}

export class BackendClient {
    static async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            ...options.headers,
        };

        const config: RequestInit = {
            ...options,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        };

        try {
            const res = await fetch(url, config);
            
            // Handle empty response body
            const text = await res.text();
            let data;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                // If JSON parsing fails but we have text, treating it as an error message might be safer,
                // or if it's empty but the status is OK (e.g. 204), we might handle it.
                 console.error("Failed to parse JSON response:", text);
                 throw new Error("Invalid JSON response from server");
            }


            if (!res.ok) {
                // If data is parsed, use it. Otherwise construct an error.
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
                    errorMessage = "Network error: Unable to reach the backend server.";
                } else {
                    errorMessage = error.message;
                }
            }

            // Fallback for network errors or parsing errors
            console.error("Backend fetch error:", error);
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
