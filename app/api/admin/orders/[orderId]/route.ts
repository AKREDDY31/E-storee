import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel } from "@/lib/db/models";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orderId } = await params;
  const body = await request.json();

  const updateData: Record<string, string> = {};
  if (body.orderStatus !== undefined) updateData.orderStatus = String(body.orderStatus);
  if (body.paymentStatus !== undefined) updateData.paymentStatus = String(body.paymentStatus);
  if (body.adminNotes !== undefined) updateData.adminNotes = String(body.adminNotes);
  if (body.estimatedDeliveryDate !== undefined) updateData.estimatedDeliveryDate = String(body.estimatedDeliveryDate);

  await connectToDatabase();
  const order = await OrderModel.findByIdAndUpdate(
    orderId,
    updateData,
    { new: true }
  ).lean();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
}
