import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { broadcastNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { subject?: unknown; message?: unknown } | null;
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  await connectToDatabase();
  const users = await UserModel.find({ role: "user", phoneVerified: true, emailVerified: true }).lean();
  const targets = users
    .map((user) => ({
      email: String((user as any).email || ""),
      name: String((user as any).name || ""),
      phoneE164: String((user as any).phoneE164 || "")
    }))
    .filter((user) => user.email && user.name && user.phoneE164);

  try {
    await broadcastNotification({ subject, message, users: targets });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to send notifications" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: targets.length });
}

