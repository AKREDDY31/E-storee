import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { VerificationModel } from "@/lib/db/models";
import { hashOtp, generateOtp } from "@/lib/otp";
import { sendPhoneOtp } from "@/lib/notifications";
import { registerPhoneSendSchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerPhoneSendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid phone OTP request" },
      { status: 400 }
    );
  }

  const phoneE164 = `+91${parsed.data.phone}`;
  const otp = generateOtp(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const purpose = parsed.data.purpose === "password_reset" ? "reset_password" : "register_phone";

  await connectToDatabase();
  await VerificationModel.deleteMany({ purpose, target: phoneE164 });
  await VerificationModel.create({
    purpose,
    target: phoneE164,
    otpHash: hashOtp(otp),
    expiresAt
  });

  try {
    await sendPhoneOtp({
      phoneE164,
      channel: parsed.data.otpChannel || "sms",
      otp
    });
  } catch (error) {
    const raw = (error as Error)?.message || "Unable to send OTP";
    const missingEnvMatch = raw.match(/Missing env ([A-Z0-9_]+)/);
    const safeMessage = missingEnvMatch
      ? `Server configuration missing: ${missingEnvMatch[1]}`
      : "Unable to send OTP right now. Please try again.";

    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
