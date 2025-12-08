import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignupPage from "./signup-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | HeapDog",
  description: "Create your HeapDog account",
};

export default async function Page() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return <SignupPage />;
}

