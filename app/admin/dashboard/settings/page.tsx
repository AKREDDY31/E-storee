import { AdminSettingsClient } from "@/components/admin/admin-settings-client";
import { getStoreSettings } from "@/lib/queries";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  const safeSettings = {
    brandName: settings.brandName,
    supportPhone: settings.supportPhone,
    supportEmail: settings.supportEmail,
    whatsappNumber: settings.whatsappNumber,
    upiId: settings.upiId,
    qrImageUrl: settings.qrImageUrl,
    businessAddress: settings.businessAddress,
    courierDetails: settings.courierDetails,
    tagline: settings.tagline,
    announcementText: settings.announcementText,
    refundPolicyText: settings.refundPolicyText,
    refundPolicyNorms: settings.refundPolicyNorms,
    subscriptionDiscountPercent: settings.subscriptionDiscountPercent,
    subscriptionBenefits: settings.subscriptionBenefits
  };

  return <AdminSettingsClient initialSettings={safeSettings} />;
}
