import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TransferOwnershipPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  redirect(`/organizations/${slug}/dashboard/settings/transfer-ownership/select-member`);
}
