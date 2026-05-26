import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string; libraryId: string }>
}

export default async function NewProblemPage({ params }: PageProps) {
  const { slug, libraryId } = await params
  redirect(
    `/organizations/${slug}/dashboard/libraries/${libraryId}/problems/new/metadata`
  )
}
