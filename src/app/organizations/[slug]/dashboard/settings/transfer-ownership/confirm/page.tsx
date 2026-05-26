import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { getStoredIdentity } from "@/lib/token-utils";
import { ConfirmTransferClient } from "./confirm-transfer-client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ selectedMemberId?: string }>;
}

export default async function ConfirmTransferPage({ params, searchParams }: PageProps) {
  const user = await requireAuth();
  
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const resolvedSearchParams = await searchParams;
  const { selectedMemberId } = resolvedSearchParams;

  if (!selectedMemberId) {
    redirect(`/organizations/${slug}/dashboard/settings/transfer-ownership/select-member`);
  }

  // 1. Strict Server-Side Security Check: Validate OIDC auth_time (re-auth must be within last 5 minutes)
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  const identity = sessionId ? await getStoredIdentity(sessionId) : null;
  const authTime = identity?.id_token_decoded?.auth_time;

  if (!authTime) {
    // If no login time is stored, redirect to re-auth
    redirect(`/organizations/${slug}/dashboard/settings/transfer-ownership/verify-identity?selectedMemberId=${selectedMemberId}&error=reauth_required`);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const sessionAgeSeconds = nowSeconds - Number(authTime);

  // Limit re-authentication to exactly 5 minutes (300 seconds)
  if (sessionAgeSeconds > 300) {
    console.warn(`Transfer ownership blocked: last login was ${sessionAgeSeconds}s ago (max 300s). Redirecting to re-auth.`);
    redirect(`/organizations/${slug}/dashboard/settings/transfer-ownership/verify-identity?selectedMemberId=${selectedMemberId}&error=reauth_expired`);
  }

  // 2. Fetch selected member details
  const organizations = await getUserOrganizations();
  const currentOrg = organizations.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  let selectedMember = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}/api/organizations/${slug}/memberships`, {
      headers: {
        Cookie: `session_id=${sessionId}`,
      },
    });
    const data = await response.json();
    if (response.ok && data.contents) {
      selectedMember = data.contents.find((m: any) => m.id === selectedMemberId) || null;
    }
  } catch (error) {
    console.error("Error fetching selected member details:", error);
  }

  if (!selectedMember) {
    redirect(`/organizations/${slug}/dashboard/settings/transfer-ownership/select-member`);
  }

  return (
    <ConfirmTransferClient slug={slug} orgName={currentOrg.orgName} selectedMember={selectedMember} />
  );
}
