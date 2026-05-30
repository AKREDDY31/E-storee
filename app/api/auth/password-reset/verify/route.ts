import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, VerificationModel } from "@/lib/db/models";
import { passwordResetVerifySchema } from "@/lib/schemas/auth";
import { hashPassword } from "@/lib/auth";
import { hashOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = passwordResetVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid reset request" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email, role: "user" });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!user.phone || String(user.phone) !== parsed.data.phone) {
    return NextResponse.json({ error: "Phone number does not match this account" }, { status: 401 });
  }

  const verification = await VerificationModel.findOne({
    purpose: "reset_password",
    target: `+91${parsed.data.phone}`,
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

  await Promise.all([
    UserModel.updateOne({ _id: user._id }, { passwordHash: await hashPassword(parsed.data.newPassword) }),
    VerificationModel.updateOne({ _id: verification._id }, { consumedAt: now })
  ]);

  return NextResponse.json({ ok: true });
}
