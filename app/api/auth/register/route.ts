import { NextResponse } from "next/server";
import { authCookieName, createSessionToken, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { registerSchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid registration data" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const existing = await UserModel.findOne({ email: parsed.data.email });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await UserModel.create({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    passwordHash,
    role: "user"
  });

  const session = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus || "inactive",
    subscriptionActive: Boolean(user.subscriptionStatus === "verified"),
    subscriptionPhone: user.subscriptionPhone || ""
  };

  const response = NextResponse.json({ user: session }, { status: 201 });
  response.cookies.set(authCookieName, createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return response;
}
