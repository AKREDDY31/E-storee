import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getUsers } from "@/lib/queries";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getUsers();
  return NextResponse.json({ users });
}
