import { requireAuth } from "@/lib/auth";
import { SecurityForm } from "./security-form";

export default async function SettingsSecurityPage() {
  await requireAuth();

  return <SecurityForm />;
}
