import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { redirect } from "next/navigation";
import { getStoredIdentity } from "@/lib/token-utils";
import { VerifyIdentityClient } from "./verify-identity-client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ selectedMemberId?: string }>;
}

export default async function VerifyIdentityPage({ params, searchParams }: PageProps) {
  await requireAuth();
  
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const resolvedSearchParams = await searchParams;
  const { selectedMemberId } = resolvedSearchParams;

  if (!selectedMemberId) {
    redirect(`/organizations/${slug}/dashboard/settings/transfer-ownership/select-member`);
  }

  // Check if session is fresh (last login was within 5 minutes / 300 seconds)
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  const identity = sessionId ? await getStoredIdentity(sessionId) : null;
  const authTime = identity?.id_token_decoded?.auth_time;

  if (authTime) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const sessionAgeSeconds = nowSeconds - Number(authTime);

    if (sessionAgeSeconds <= 300) {
      console.log(`VerifyIdentityPage: session is fresh (${sessionAgeSeconds}s old). Skipping re-auth and proceeding to Step 3.`);
      redirect(`/organizations/${slug}/dashboard/settings/transfer-ownership/confirm?selectedMemberId=${selectedMemberId}`);
    }
  }

  const organizations = await getUserOrganizations();
  const currentOrg = organizations.find((o) => o.slug === slug);

  if (!currentOrg) {
    redirect("/organizations");
  }

  return (
    <VerifyIdentityClient slug={slug} orgName={currentOrg.orgName} selectedMemberId={selectedMemberId} />
  );
}
