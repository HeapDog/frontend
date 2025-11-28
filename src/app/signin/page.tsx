import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SigninPage from "./signin-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | HeapDog",
  description: "Sign in to your HeapDog account",
};

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const redirectUrl = (searchParams.redirect as string) || "/";

  const user = await getCurrentUser();

  if (user) {
    redirect(redirectUrl);
  }

  return <SigninPage />;
}
