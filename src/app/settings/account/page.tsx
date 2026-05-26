import { requireAuth } from "@/lib/auth";
import { AccountForm } from "./account-form";

export default async function SettingsAccountPage() {
  await requireAuth();

  return <AccountForm />;
}
