import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  try {
    await connectToDatabase();
    const user = await UserModel.findById(session.id).lean();
    if (user) {
      return NextResponse.json({
        user: {
          id: session.id,
          name: user.name,
          age: user.age ?? undefined,
          email: user.email,
          phone: user.phone ?? undefined,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus || "inactive",
          subscriptionActive: Boolean(user.subscriptionStatus === "verified"),
          subscriptionPhone: user.subscriptionPhone || ""
        }
      });
    }
  } catch {
    // fall back to the token payload below
  }

  return NextResponse.json({ user: session });
}
