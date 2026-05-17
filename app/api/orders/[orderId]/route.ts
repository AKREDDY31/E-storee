import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentSession } from "@/lib/auth";
import { OrderModel, RefundModel } from "@/lib/db/models";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  await connectToDatabase();
  const order = await OrderModel.findById(orderId).lean();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getCurrentSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const body = await request.json();
  const paymentReference = typeof body.paymentReference === "string" ? body.paymentReference.trim() : "";
  const action = body.action;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";

  await connectToDatabase();
  const order = await OrderModel.findOne({ _id: orderId, userId: session.id });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (paymentReference) {
    if (order.paymentMethod !== "ONLINE") {
      return NextResponse.json({ error: "Payment reference can be submitted only for online orders" }, { status: 400 });
    }
    if (order.paymentStatus !== "awaiting_verification") {
      return NextResponse.json({ error: "Payment reference can be submitted only while payment is awaiting verification" }, { status: 400 });
    }

    order.paymentReference = paymentReference;
    order.paymentStatus = "paid";
    order.adminNotes = order.adminNotes
      ? `${order.adminNotes}\nPayment reference submitted by customer. Awaiting verification.`
      : "Payment reference submitted by customer. Awaiting verification.";
    await order.save();
    return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
  }

  if (action !== "cancel" && action !== "return") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json({ error: "Please choose a reason" }, { status: 400 });
  }

  if (action === "cancel") {
    const cancellableStatuses = new Set(["placed", "confirmed", "packed"]);
    if (!cancellableStatuses.has(order.orderStatus)) {
      return NextResponse.json({ error: "This order can no longer be cancelled from your account" }, { status: 400 });
    }

    const isPrepaid = order.paymentMethod === "ONLINE" && ["awaiting_verification", "paid"].includes(order.paymentStatus);
    if (isPrepaid) {
      order.orderStatus = "refund_requested";
      order.adminNotes = "Cancellation approved in principle. Amount will be refunded within 48 hours after pickup/verification as per refund policy.";
      await RefundModel.create({
        orderId: order._id,
        userId: session.id,
        requestType: "cancel",
        reason,
        details,
        pickupStatus: "not_required",
        status: "requested"
      });
    } else {
      order.orderStatus = "cancelled";
      order.adminNotes = "Order cancelled by customer request.";
    }

    await order.save();
    return NextResponse.json({
      message: isPrepaid
        ? "Cancellation request received. For prepaid orders, refund is processed within 48 hours after pickup/verification."
        : "Order cancelled successfully.",
      order: JSON.parse(JSON.stringify(order))
    });
  }

  if (order.orderStatus !== "delivered") {
    return NextResponse.json({ error: "Return request is available only after delivery" }, { status: 400 });
  }

  const existingRefund = await RefundModel.findOne({ orderId: order._id, status: { $in: ["requested", "approved", "processed"] } }).lean();
  if (existingRefund) {
    return NextResponse.json({ error: "A refund/return request already exists for this order" }, { status: 409 });
  }

  await RefundModel.create({
    orderId: order._id,
    userId: session.id,
    requestType: "return",
    reason,
    details,
    pickupStatus: "awaiting_pickup",
    status: "requested"
  });

  order.orderStatus = "refund_requested";
  order.adminNotes = "Return pickup will be arranged. For prepaid orders, refund is processed within 48 hours after product collection.";
  await order.save();

  return NextResponse.json({
    message: "Return request submitted. Pickup will be arranged, and prepaid refund is processed within 48 hours after collection.",
    order: JSON.parse(JSON.stringify(order))
  });
}
