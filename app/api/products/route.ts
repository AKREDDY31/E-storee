import { NextResponse } from "next/server";
import { getFreshProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getFreshProducts();
  return NextResponse.json({ products });
}
