import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel, ProductModel, SettingsModel, UserModel } from "@/lib/db/models";
import { invalidateStoreCaches } from "@/lib/queries";
import { orderSchema } from "@/lib/schemas/order";
import { formatAddressLine, normalizePhoneNumber } from "@/lib/utils";

function buildOrderNumber() {
  revalidatePath("/shop");
  revalidatePath("/shop/[slug]");
  revalidatePath("/admin/dashboard/orders");
  revalidatePath("/admin/dashboard");
  return `VED-${Date.now().toString().slice(-8)}`;
}

function buildEstimatedDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toISOString();
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
  }

  await connectToDatabase();
  const session = await getCurrentSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Please sign in to place an order" }, { status: 401 });
  }
  const user = await UserModel.findById(session.id).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const settings = (await SettingsModel.findOne({ key: "store" }).lean()) as { subscriptionDiscountPercent?: number } | null;
  const productIds = parsed.data.items.map((item) => item._id).filter(Boolean);
  const dbProducts = await ProductModel.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(dbProducts.map((product) => [String(product._id), product]));

  for (const item of parsed.data.items) {
    if (!item._id) {
      return NextResponse.json({ error: `Invalid product reference for ${item.name}` }, { status: 400 });
    }
    const dbProduct = productMap.get(item._id);
    if (!dbProduct) {
      return NextResponse.json({ error: `${item.name} is no longer available` }, { status: 404 });
    }
    if ((dbProduct.stock || 0) < item.quantity) {
      return NextResponse.json(
        { error: `${item.name} has only ${dbProduct.stock || 0} items left in stock` },
        { status: 400 }
      );
    }
  }

  const subtotal = parsed.data.items.reduce((sum, item) => {
    const dbProduct = item._id ? productMap.get(item._id) : undefined;
    const price = Number((dbProduct as any)?.price ?? item.price ?? 0);
    return sum + price * item.quantity;
  }, 0);
  const shippingCharge = parsed.data.items.length > 0 ? 60 : 0;
  const requestedSubscriptionPhone = normalizePhoneNumber(parsed.data.subscriptionPhone || "");
  const storedSubscriptionPhone = normalizePhoneNumber(user.subscriptionPhone || user.phone || "");
  const subscriptionEligible = Boolean(
    parsed.data.subscriptionEligible && user.subscriptionStatus === "verified" && requestedSubscriptionPhone && requestedSubscriptionPhone === storedSubscriptionPhone
  );
  const subscriptionDiscountPercent = subscriptionEligible ? Number(settings?.subscriptionDiscountPercent ?? 0) : 0;
  const discountAmount = Math.min(subtotal, Math.round((subtotal * subscriptionDiscountPercent) / 100));
  const total = Math.max(0, subtotal - discountAmount + shippingCharge);

  const order = await OrderModel.create({
    ...parsed.data,
    userId: session.id,
    orderNumber: buildOrderNumber(),
    subtotal,
    shippingCharge,
    total,
    discountAmount,
    subscriptionEligible,
    subscriptionPhone: subscriptionEligible ? storedSubscriptionPhone : "",
    paymentStatus: parsed.data.paymentMethod === "ONLINE" ? "awaiting_verification" : "pending",
    orderStatus: "placed",
    estimatedDeliveryDate: parsed.data.estimatedDeliveryDate || buildEstimatedDeliveryDate(),
    items: parsed.data.items.map((item) => ({
      productId: item._id,
      name: item.name,
      slug: item.slug,
      itemCode: item.itemCode,
      price: Number((item._id ? productMap.get(item._id) : undefined)?.price ?? item.price ?? 0),
      quantity: item.quantity,
      imageUrl: item.imageUrl
    }))
  });

  const customerName = order.customer?.name ?? parsed.data.customer.name;
  const customerPhone = order.customer?.phone ?? parsed.data.customer.phone;
  const customerEmail = order.customer?.email ?? parsed.data.customer.email;
  const address = order.shippingAddress ?? parsed.data.shippingAddress;

  const adminSummary = [
    `New order: ${order.orderNumber}`,
    `Customer: ${customerName} | ${customerPhone} | ${customerEmail}`,
    `Address: ${formatAddressLine(address)}`,
    `Items: ${order.items.map((item) => `${item.name} x ${item.quantity}`).join("; ")}`,
    `Total: ${order.total}`,
    `Payment: ${order.paymentMethod} | ${order.paymentStatus}`,
    order.subscriptionEligible ? `Subscription discount applied: ${discountAmount}` : "Subscription discount not applied"
  ].join("\n");

  await OrderModel.updateOne(
    { _id: order._id },
    {
      adminNotes: order.adminNotes ? `${order.adminNotes}\n\n${adminSummary}` : adminSummary
    }
  );

  await Promise.all(
    parsed.data.items.map((item) =>
      ProductModel.updateOne(
        { _id: item._id },
        {
          $inc: {
            stock: -item.quantity,
            purchaseCount: item.quantity
          }
        }
      )
    )
  );
  invalidateStoreCaches();

  return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) }, { status: 201 });
}
