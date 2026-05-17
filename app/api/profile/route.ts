import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieName, createSessionToken, getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { profileSchema } from "@/lib/schemas/profile";

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid profile data" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const user = await UserModel.findByIdAndUpdate(
    session.id,
    {
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address
    },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updatedSession = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus || "inactive",
    subscriptionActive: Boolean(user.subscriptionStatus === "verified"),
    subscriptionPhone: user.subscriptionPhone || ""
  };

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, createSessionToken(updatedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return NextResponse.json({
    user: updatedSession,
    address: user.address
  });
}
