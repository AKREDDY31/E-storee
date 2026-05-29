import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { passwordResetStartSchema } from "@/lib/schemas/auth";
import { sendPhoneOtp } from "@/lib/notifications";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = passwordResetStartSchema.safeParse(body);

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

  if (!user.phoneVerified || !user.emailVerified) {
    return NextResponse.json({ error: "Account is not verified yet" }, { status: 403 });
  }

  const phoneE164 = `+91${parsed.data.phone}`;

  await sendPhoneOtp({ channel: parsed.data.otpChannel, phoneE164, otp: "000000" });

  return NextResponse.json({ ok: true });
}
