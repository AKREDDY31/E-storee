import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, VerificationModel } from "@/lib/db/models";
import { registerStartSchema } from "@/lib/schemas/auth";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmailOtp, sendPhoneOtp } from "@/lib/notifications";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerStartSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid registration data" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const existing = await UserModel.findOne({ email: parsed.data.email, role: "user" });
  if (existing && existing.emailVerified && existing.phoneVerified) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const phoneE164 = `+91${parsed.data.phone}`;
  const otpEmail = generateOtp(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const user = existing
    ? await UserModel.findOneAndUpdate(
        { _id: existing._id },
        {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          phoneE164,
          phoneVerified: false,
          emailVerified: false
        },
        { new: true }
      )
    : await UserModel.create({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        phoneE164,
        phoneVerified: false,
        emailVerified: false,
        passwordHash: await hashPassword(parsed.data.password),
        role: "user"
      });

  await VerificationModel.deleteMany({ userId: user._id, purpose: { $in: ["register_phone", "register_email"] } });
  await VerificationModel.create([
    {
      userId: user._id,
      purpose: "register_email",
      target: parsed.data.email,
      otpHash: hashOtp(otpEmail),
      expiresAt
    }
  ]);

  await Promise.all([
    sendPhoneOtp({ channel: parsed.data.otpChannel, phoneE164, otp: "000000" }),
    sendEmailOtp({ email: parsed.data.email, name: parsed.data.name, otp: otpEmail })
  ]);

  return NextResponse.json({ ok: true, requiresVerification: true }, { status: 201 });
}
