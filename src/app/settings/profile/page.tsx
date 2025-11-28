import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function SettingsProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <ProfileForm user={user} />
    </div>
  );
}
