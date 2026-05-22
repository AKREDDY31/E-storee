import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/queries";

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({
    brandName: settings.brandName,
    siteLogoUrl: settings.siteLogoUrl,
    upiId: settings.upiId,
    qrImageUrl: settings.qrImageUrl,
    subscriptionDiscountPercent: settings.subscriptionDiscountPercent,
    subscriptionBenefits: settings.subscriptionBenefits,
    whatsappNumber: settings.whatsappNumber
  });
}

