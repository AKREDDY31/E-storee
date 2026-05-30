import { NextResponse } from "next/server";
import { authCookieName, createSessionToken, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, VerificationModel } from "@/lib/db/models";
import { registerCompleteSchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerCompleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid registration data" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const now = new Date();
  const phoneE164 = `+91${parsed.data.phone}`;

  const [emailVerification, phoneVerification] = await Promise.all([
    VerificationModel.findOne({
      purpose: "register_email",
      target: parsed.data.email,
      consumedAt: { $exists: true }
    })
      .sort({ updatedAt: -1 })
      .lean(),
    VerificationModel.findOne({
      purpose: "register_phone",
      target: phoneE164,
      consumedAt: { $exists: true }
    })
      .sort({ updatedAt: -1 })
      .lean()
  ]);

  if (!emailVerification || new Date(emailVerification.expiresAt) < now) {
    return NextResponse.json({ error: "Email is not verified yet" }, { status: 403 });
  }

  if (!phoneVerification || new Date(phoneVerification.expiresAt) < now) {
    return NextResponse.json({ error: "Phone number is not verified yet" }, { status: 403 });
  }

  const existingByEmail = await UserModel.findOne({ email: parsed.data.email });
  if (existingByEmail && existingByEmail.role !== "user") {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = existingByEmail
    ? await UserModel.findOneAndUpdate(
        { _id: existingByEmail._id },
        {
          name: parsed.data.name,
          age: parsed.data.age,
          email: parsed.data.email,
          phone: parsed.data.phone,
          phoneE164,
          passwordHash,
          phoneVerified: true,
          emailVerified: true,
          role: "user"
        },
        { new: true }
      )
    : await UserModel.create({
        name: parsed.data.name,
        age: parsed.data.age,
        email: parsed.data.email,
        phone: parsed.data.phone,
        phoneE164,
        passwordHash,
        phoneVerified: true,
        emailVerified: true,
        role: "user"
      });

  if (!user) {
    return NextResponse.json({ error: "Unable to create account. Please try again." }, { status: 500 });
  }

  await Promise.all([
    VerificationModel.deleteMany({ purpose: "register_email", target: parsed.data.email }),
    VerificationModel.deleteMany({ purpose: "register_phone", target: phoneE164 })
  ]);

  const session = {
    id: user._id.toString(),
    name: user.name,
    age: user.age ?? undefined,
    email: user.email,
    phone: user.phone ?? undefined,
    phoneVerified: true,
    emailVerified: true,
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
