import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { VerificationModel } from "@/lib/db/models";
import { hashOtp } from "@/lib/otp";

function redirectToRegister(request: Request, email: string, verified: boolean, reason?: string) {
  const redirectUrl = new URL("/register", request.url);
  if (email) {
    redirectUrl.searchParams.set("email", email);
  }
  if (verified) {
    redirectUrl.searchParams.set("emailVerified", "1");
  }
  if (!verified && reason) {
    redirectUrl.searchParams.set("verificationError", reason);
  }
  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const email = (url.searchParams.get("email") || "").trim();

  if (!token || !email) {
    return redirectToRegister(request, email, false, "invalid");
  }

  await connectToDatabase();
  const now = new Date();

  const verification = await VerificationModel.findOneAndUpdate(
    {
      purpose: "register_email",
      target: email,
      otpHash: hashOtp(token),
      consumedAt: { $exists: false },
      expiresAt: { $gt: now }
    },
    { consumedAt: now }
  );

  if (!verification) {
    return redirectToRegister(request, email, false, "expired_or_invalid");
  }

  return redirectToRegister(request, email, true);
}
