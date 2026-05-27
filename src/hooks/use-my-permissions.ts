import { useQuery } from "@tanstack/react-query";
import { MyPermissionsResponse, hasPermission } from "@/lib/permissions";
import { ApiErrorResponse, ApiResponse } from "@/lib/types/api";

export function useMyPermissions(slug: string) {
  const query = useQuery<ApiResponse<MyPermissionsResponse>, ApiErrorResponse>({
    queryKey: ["my-permissions", slug],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${encodeURIComponent(slug)}/acl/my-permissions`);
      if (!res.ok) {
        const errorData = await res.json();
        throw errorData;
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    enabled: Boolean(slug),
  });

  const check = (permission: string, containerId?: string): boolean => {
    if (!query.data?.data) return false;
    return hasPermission(query.data.data, permission, containerId);
  };

  return {
    permissions: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    check,
    refetch: query.refetch,
  };
}
