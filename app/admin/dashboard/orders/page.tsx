import { AdminOrdersClient } from "@/components/admin/admin-orders-client";
import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel } from "@/lib/db/models";

export default async function AdminOrdersPage() {
  let orders: any[] = [];
  try {
    await connectToDatabase();
    orders = JSON.parse(JSON.stringify(await OrderModel.find().sort({ createdAt: -1 }).lean()));
  } catch {
    orders = [];
  }
  return <AdminOrdersClient initialOrders={orders} />;
}
