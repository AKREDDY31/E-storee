import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { comparePassword, hashPassword } from "@/lib/auth";
import { validateAdminSecret } from "@/lib/server-utils";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid reset request" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email, role: parsed.data.role });

  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (parsed.data.role === "admin") {
    const validSecret = await validateAdminSecret(parsed.data.secretCode);
    if (!validSecret) {
      return NextResponse.json({ error: "Secret code does not match" }, { status: 401 });
    }
  } else {
    if (!user.passwordResetSecretHash) {
      return NextResponse.json({ error: "Password reset secret is missing for this account" }, { status: 403 });
    }

    const validSecret = await comparePassword(parsed.data.secretCode, user.passwordResetSecretHash);
    if (!validSecret) {
      return NextResponse.json({ error: "Secret code does not match" }, { status: 401 });
    }
  }

  user.passwordHash = await hashPassword(parsed.data.newPassword);
  await user.save();

  return NextResponse.json({ ok: true });
}
