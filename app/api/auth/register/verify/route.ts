import { NextResponse } from "next/server";
import { authCookieName, createSessionToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, VerificationModel } from "@/lib/db/models";
import { registerVerifySchema } from "@/lib/schemas/auth";
import { hashOtp } from "@/lib/otp";
import { twilioCheckVerification } from "@/lib/notifications/twilio-verify";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid verification request" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email, role: "user" });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const phoneE164 = `+91${parsed.data.phone}`;
  const now = new Date();
  const [emailVerification, phoneApproved] = await Promise.all([
    VerificationModel.findOne({
      userId: user._id,
      purpose: "register_email",
      target: parsed.data.email,
      consumedAt: { $exists: false }
    }).lean(),
    (async () => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
      const authToken = process.env.TWILIO_AUTH_TOKEN || "";
      const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "";
      if (!accountSid || !authToken || !verifyServiceSid) {
        throw new Error("Twilio Verify is not configured");
      }
      return twilioCheckVerification({
        accountSid,
        authToken,
        verifyServiceSid,
        phone10: parsed.data.phone,
        code: parsed.data.phoneOtp
      });
    })()
  ]);

  if (!emailVerification) {
    return NextResponse.json({ error: "OTP not found. Please request OTP again." }, { status: 404 });
  }

  if (new Date(emailVerification.expiresAt) < now) {
    return NextResponse.json({ error: "OTP expired. Please request OTP again." }, { status: 410 });
  }

  if (!phoneApproved) return NextResponse.json({ error: "Incorrect phone OTP" }, { status: 401 });
  if (emailVerification.otpHash !== hashOtp(parsed.data.emailOtp)) {
    return NextResponse.json({ error: "Incorrect email OTP" }, { status: 401 });
  }

  await Promise.all([
    UserModel.updateOne(
      { _id: user._id },
      {
        phone: parsed.data.phone,
        phoneE164,
        phoneVerified: true,
        emailVerified: true
      }
    ),
    VerificationModel.updateOne({ _id: emailVerification._id }, { consumedAt: now })
  ]);

  const session = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: parsed.data.phone,
    phoneVerified: true,
    emailVerified: true,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus || "inactive",
    subscriptionActive: Boolean(user.subscriptionStatus === "verified"),
    subscriptionPhone: user.subscriptionPhone || ""
  };

  const response = NextResponse.json({ user: session });
  response.cookies.set(authCookieName, createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return response;
}
