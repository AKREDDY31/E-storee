import { comparePassword } from "@/lib/auth";
import { ensureStoreSettings } from "@/lib/queries";

export async function validateAdminSecret(secretCode: string) {
  const settings = await ensureStoreSettings();
  if (!settings.adminSecretHash) {
    return false;
  }
  return comparePassword(secretCode, settings.adminSecretHash);
}
