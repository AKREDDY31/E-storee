import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { VerificationModel } from "@/lib/db/models";
import { hashOtp } from "@/lib/otp";
import { sendEmailVerificationLink } from "@/lib/notifications";
import { registerEmailLinkSchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerEmailLinkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid email verification request" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await VerificationModel.deleteMany({ purpose: "register_email", target: parsed.data.email });
  await VerificationModel.create({
    purpose: "register_email",
    target: parsed.data.email,
    otpHash: hashOtp(token),
    expiresAt
  });

  try {
    const baseUrl =
      process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/auth/register/email-verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(parsed.data.email)}`;

    await sendEmailVerificationLink({
      email: parsed.data.email,
      name: parsed.data.name,
      verificationUrl
    });
  } catch (error) {
    const raw = (error as Error)?.message || "Unable to send verification link";
    const missingEnvMatch = raw.match(/Missing env ([A-Z0-9_]+)/);
    const safeMessage = missingEnvMatch
      ? `Server configuration missing: ${missingEnvMatch[1]}`
      : "Unable to send verification link right now. Please try again.";

    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
