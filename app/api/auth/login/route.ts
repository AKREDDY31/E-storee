import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieName, comparePassword, createSessionToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { loginSchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid login request" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email });

  if (!user || user.role !== parsed.data.role) {
    return NextResponse.json({ error: "User not found for this role" }, { status: 404 });
  }

  const valid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const session = {
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
  cookieStore.set(authCookieName, createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return NextResponse.json({ user: session });
}
