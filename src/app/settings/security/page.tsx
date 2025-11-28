import { requireUser } from "@/lib/auth";
import { SecurityForm } from "./security-form";

export default async function SettingsSecurityPage() {
  await requireUser();

  return <SecurityForm />;
}
