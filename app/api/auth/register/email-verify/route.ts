import { NextResponse } from "next/server";

export async function GET(request: Request) {
  void request;
  return NextResponse.json({ error: "Legacy endpoint removed. Registration no longer uses email verification." }, { status: 410 });
}
