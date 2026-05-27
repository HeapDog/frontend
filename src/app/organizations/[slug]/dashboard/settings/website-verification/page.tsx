import { requireAuth } from "@/lib/auth";
import { BackendClient } from "@/lib/backend-client";
import { ErrorView } from "@/components/error-view";
import { ApiErrorResponse } from "@/lib/types/api";
import { getValidAccessToken } from "@/lib/token-utils";
import { OrganizationWebsiteVerification } from "@/lib/types/organization";
import { WebsiteVerificationView } from "./website-verification-view";

async function getWebsiteInfo(slug: string) {
  try {
    const token = await getValidAccessToken();
    if (!token) throw new Error("Authentication required");

    const response = await BackendClient.get<OrganizationWebsiteVerification>(
      `/organizations/${slug}/website`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return { data: response.data, error: null, notFound: false };
  } catch (error) {
    const apiError = error as ApiErrorResponse;
    if (apiError?.status === 404) {
      return { data: null, error: null, notFound: true };
    }
    return { data: null, error };
  }
}

interface WebsiteVerificationPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WebsiteVerificationSettingsPage({
  params,
}: WebsiteVerificationPageProps) {
  await requireAuth();
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const { data: website, error, notFound } = await getWebsiteInfo(slug);

  if (error) {
    return (
      <ErrorView
        error={error as ApiErrorResponse}
        retryLink={`/organizations/${slug}/dashboard/settings/website-verification`}
      />
    );
  }

  const showMissingWebsite = notFound || !website?.address;

  return (
    <WebsiteVerificationView
      slug={slug}
      website={website}
      showMissingWebsite={showMissingWebsite}
    />
  );
}
