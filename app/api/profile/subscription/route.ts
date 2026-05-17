import { NextResponse } from "next/server";
import { authCookieName, createSessionToken, getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { normalizePhoneNumber } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const paymentReference = String(body.paymentReference || "").trim();
  const subscriptionPhone = normalizePhoneNumber(String(body.subscriptionPhone || ""));

  if (!paymentReference) {
    return NextResponse.json({ error: "Payment reference is required to activate a subscription" }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const phone = normalizePhoneNumber(subscriptionPhone || user.phone || "");
  if (!phone) {
    return NextResponse.json({ error: "Add your phone number before activating subscription" }, { status: 400 });
  }

  user.subscriptionStatus = "pending";
  user.subscriptionActive = false;
  user.subscriptionPhone = phone;
  user.subscriptionStartedAt = new Date();
  (user as any).subscriptionPaymentReference = paymentReference;
  (user as any).subscriptionPaidAmount = 500;
  await user.save();

  const updatedSession = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    subscriptionStatus: "pending" as const,
    subscriptionActive: false,
    subscriptionPhone: user.subscriptionPhone || ""
  };

  const response = NextResponse.json({ user: updatedSession });
  response.cookies.set(authCookieName, createSessionToken(updatedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return response;
}
