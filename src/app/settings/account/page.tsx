import { requireUser } from "@/lib/auth";
import { AccountForm } from "./account-form";

export default async function SettingsAccountPage() {
  await requireUser();

  return <AccountForm />;
}
