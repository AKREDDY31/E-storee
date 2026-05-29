import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSession, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { SettingsModel, UserModel } from "@/lib/db/models";
import { ensureStoreSettings, invalidateStoreCaches } from "@/lib/queries";
import { validateAdminSecret } from "@/lib/server-utils";
import { broadcastNotification } from "@/lib/notifications";

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
  if (body.siteLogoUrl !== undefined) updateData.siteLogoUrl = String(body.siteLogoUrl);
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

  void (async () => {
    try {
      const changes: string[] = [];
      const before = settings as any;
      const after = updated as any;

      const watchKeys: Array<{ key: string; label: string }> = [
        { key: "courierDetails", label: "Delivery / courier details" },
        { key: "announcementText", label: "Announcement" },
        { key: "supportPhone", label: "Support phone" },
        { key: "supportEmail", label: "Support email" },
        { key: "whatsappNumber", label: "Support WhatsApp" },
        { key: "subscriptionDiscountPercent", label: "Subscription discount" }
      ];

      for (const item of watchKeys) {
        if (updateData[item.key] !== undefined && String(before?.[item.key] ?? "") !== String(after?.[item.key] ?? "")) {
          changes.push(item.label);
        }
      }

      if (changes.length === 0) return;

      const subject = "Store update";
      const message = `We updated: ${changes.join(", ")}.`;

      const users = await UserModel.find({ role: "user", phoneVerified: true, emailVerified: true }).lean();
      const targets = users
        .map((user) => ({
          email: String((user as any).email || ""),
          name: String((user as any).name || ""),
          phoneE164: String((user as any).phoneE164 || "")
        }))
        .filter((user) => user.email && user.name && user.phoneE164);

      await broadcastNotification({ subject, message, users: targets });
    } catch {
      // best-effort
    }
  })();

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
