import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSession, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { SettingsModel } from "@/lib/db/models";
import { ensureStoreSettings, invalidateStoreCaches } from "@/lib/queries";
import { validateAdminSecret } from "@/lib/server-utils";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await ensureStoreSettings();
  const { adminSecretHash, ...safeSettings } = settings;
  return NextResponse.json({ settings: safeSettings });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await connectToDatabase();
  const settings = await ensureStoreSettings();

  if (body.currentSecretCode !== undefined || body.newSecretCode !== undefined) {
    if (!body.currentSecretCode || !body.newSecretCode) {
      return NextResponse.json({ error: "Both current and new secret codes are required" }, { status: 400 });
    }

    const valid = await validateAdminSecret(body.currentSecretCode);
    if (!valid) {
      return NextResponse.json({ error: "Current secret code is incorrect" }, { status: 401 });
    }
    await SettingsModel.updateOne(
      { key: "store" },
      { adminSecretHash: await hashPassword(body.newSecretCode) }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.brandName !== undefined) updateData.brandName = String(body.brandName);
  if (body.supportPhone !== undefined) updateData.supportPhone = String(body.supportPhone);
  if (body.supportEmail !== undefined) updateData.supportEmail = String(body.supportEmail);
  if (body.whatsappNumber !== undefined) updateData.whatsappNumber = String(body.whatsappNumber);
  if (body.upiId !== undefined) updateData.upiId = String(body.upiId);
  if (body.qrImageUrl !== undefined) updateData.qrImageUrl = String(body.qrImageUrl);
  if (body.businessAddress !== undefined) updateData.businessAddress = String(body.businessAddress);
  if (body.courierDetails !== undefined) updateData.courierDetails = String(body.courierDetails);
  if (body.tagline !== undefined) updateData.tagline = String(body.tagline);
  if (body.announcementText !== undefined) updateData.announcementText = String(body.announcementText);
  if (body.refundPolicyText !== undefined) updateData.refundPolicyText = String(body.refundPolicyText);
  if (body.refundPolicyNorms !== undefined) updateData.refundPolicyNorms = String(body.refundPolicyNorms);
  if (body.subscriptionDiscountPercent !== undefined) updateData.subscriptionDiscountPercent = Number(body.subscriptionDiscountPercent);
  if (body.subscriptionBenefits !== undefined) {
    updateData.subscriptionBenefits = String(body.subscriptionBenefits)
      .split(/\r?\n/)
      .map((benefit) => benefit.trim())
      .filter(Boolean)
      ;
  }

  const updated = await SettingsModel.findOneAndUpdate({ key: "store" }, updateData, {
    new: true
  }).lean();
  invalidateStoreCaches();
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/policies");
  revalidatePath("/login");
  revalidatePath("/register");
  revalidatePath("/forgot-password");
  revalidatePath("/shop");
  revalidatePath("/shop/[slug]");
  revalidatePath("/checkout");
  revalidatePath("/track-order");
  revalidatePath("/account");
  revalidatePath("/account/orders");

  const { adminSecretHash, ...safeSettings } = JSON.parse(JSON.stringify(updated));
  return NextResponse.json({ settings: safeSettings });
}
