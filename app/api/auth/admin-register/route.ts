import { NextResponse } from "next/server";
import { authCookieName, createSessionToken, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { adminRegisterSchema } from "@/lib/schemas/auth";
import { validateAdminSecret } from "@/lib/server-utils";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adminRegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid admin registration data" },
      { status: 400 }
    );
  }

  const secretValid = await validateAdminSecret(parsed.data.secretCode);
  if (!secretValid) {
    return NextResponse.json({ error: "Secret code does not match" }, { status: 401 });
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
    role: "admin"
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
