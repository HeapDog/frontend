import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import VerifyPage from "./verify-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email | HeapDog",
  description: "Verify your email address",
};

export default async function Page() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return <VerifyPage />;
}

