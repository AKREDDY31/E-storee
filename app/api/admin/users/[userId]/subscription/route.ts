import { NextResponse } from "next/server";
import { getCurrentSession, createSessionToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { cookies } from "next/headers";
import { authCookieName } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "approve");

  await connectToDatabase();
  const user = await UserModel.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (action === "reject") {
    user.subscriptionStatus = "inactive";
    user.subscriptionActive = false;
  } else {
    user.subscriptionStatus = "verified";
    user.subscriptionActive = true;
    if (!user.subscriptionStartedAt) {
      user.subscriptionStartedAt = new Date();
    }
  }

  await user.save();

  const updatedSession = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus || "inactive",
    subscriptionActive: Boolean(user.subscriptionStatus === "verified"),
    subscriptionPhone: user.subscriptionPhone || ""
  };

  const cookieStore = await cookies();
  if (session.id === updatedSession.id) {
    cookieStore.set(authCookieName, createSessionToken(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
  }

  return NextResponse.json({ user: JSON.parse(JSON.stringify(user)) });
}
