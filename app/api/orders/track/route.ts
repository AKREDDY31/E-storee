import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel } from "@/lib/db/models";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber");
  if (!orderNumber) {
    return NextResponse.json({ error: "Order number is required" }, { status: 400 });
  }

  await connectToDatabase();
  const order = await OrderModel.findOne({ orderNumber }).lean();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
}
