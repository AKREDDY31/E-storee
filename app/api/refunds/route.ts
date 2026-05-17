import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel, RefundModel } from "@/lib/db/models";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await connectToDatabase();

  const order = await OrderModel.findOne({ orderNumber: body.orderNumber, userId: session.id });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!body.reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const refund = await RefundModel.create({
    orderId: order._id,
    userId: session.id,
    requestType: body.requestType === "cancel" ? "cancel" : "return",
    reason: body.reason,
    details: body.details,
    pickupStatus: body.requestType === "cancel" ? "not_required" : "awaiting_pickup"
  });

  order.orderStatus = "refund_requested";
  order.adminNotes = "Refund request received. For prepaid orders, amount will be refunded within 48 hours after pickup/verification.";
  await order.save();

  return NextResponse.json({ refund: JSON.parse(JSON.stringify(refund)) }, { status: 201 });
}
