import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Legacy endpoint removed. Use /api/auth/register with verified email link and phone OTP." },
    { status: 410 }
  );
}
