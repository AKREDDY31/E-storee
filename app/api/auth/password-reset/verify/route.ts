import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { passwordResetVerifySchema } from "@/lib/schemas/auth";
import { hashPassword } from "@/lib/auth";
import { twilioCheckVerification } from "@/lib/notifications/twilio-verify";

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

  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "";
  if (!accountSid || !authToken || !verifyServiceSid) {
    return NextResponse.json({ error: "Twilio Verify is not configured" }, { status: 500 });
  }

  const approved = await twilioCheckVerification({
    accountSid,
    authToken,
    verifyServiceSid,
    phone10: parsed.data.phone,
    code: parsed.data.otp
  });

  if (!approved) {
    return NextResponse.json({ error: "Incorrect OTP" }, { status: 401 });
  }

  await UserModel.updateOne({ _id: user._id }, { passwordHash: await hashPassword(parsed.data.newPassword) });

  return NextResponse.json({ ok: true });
}
