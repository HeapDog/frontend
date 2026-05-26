import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
}

/**
 * Redirects to canonical invitation accept URL.
 * Canonical: /invitations/accept?code=X&org=slug
 */
export default async function OrgInvitationAcceptRedirect({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { code } = await searchParams;

  if (!code) {
    redirect("/invitations/accept?error=missing_code");
  }

  redirect(`/invitations/accept?code=${encodeURIComponent(code)}&org=${encodeURIComponent(slug)}`);
}
