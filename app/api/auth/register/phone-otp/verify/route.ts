import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { VerificationModel } from "@/lib/db/models";
import { hashOtp } from "@/lib/otp";
import { registerPhoneVerifySchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerPhoneVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid phone OTP verification" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const phoneE164 = `+91${parsed.data.phone}`;
  const purpose = parsed.data.purpose === "password_reset" ? "reset_password" : "register_phone";

  const verification = await VerificationModel.findOne({
    purpose,
    target: phoneE164,
    consumedAt: { $exists: false }
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!verification) {
    return NextResponse.json({ error: "OTP not found. Please request OTP again." }, { status: 404 });
  }

  const now = new Date();
  if (new Date(verification.expiresAt) < now) {
    return NextResponse.json({ error: "OTP expired. Please request OTP again." }, { status: 410 });
  }

  if (verification.otpHash !== hashOtp(parsed.data.otp)) {
    return NextResponse.json({ error: "Incorrect OTP" }, { status: 401 });
  }

  await VerificationModel.updateOne({ _id: verification._id }, { consumedAt: now });

  return NextResponse.json({ ok: true, verified: true });
}
