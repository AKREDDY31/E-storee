import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json({ error: "Legacy endpoint removed. Password reset now uses email and secret code." }, { status: 410 });
}
