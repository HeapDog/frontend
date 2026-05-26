import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function AclsRedirectPage({ params }: PageProps) {
  await requireAuth()
  const { slug } = await params
  redirect(`/organizations/${slug}/dashboard/acls/visual/general-access-rules`)
}
