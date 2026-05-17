import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { ProductModel, SettingsModel, UserModel } from "@/lib/db/models";
import { seedProducts } from "@/lib/data/products";
import { hashPassword } from "@/lib/auth";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { invalidateStoreCaches } from "@/lib/queries";

export async function POST() {
  await connectToDatabase();

  for (const product of seedProducts) {
    await ProductModel.updateOne({ itemCode: product.itemCode }, product, { upsert: true });
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);
    await UserModel.updateOne(
      { email: process.env.ADMIN_EMAIL },
      { name: "Vedics Admin", email: process.env.ADMIN_EMAIL, passwordHash, role: "admin" },
      { upsert: true }
    );
  }

  const adminSecretHash = await hashPassword(process.env.ADMIN_SECRET_CODE || "005577");
  await SettingsModel.updateOne(
    { key: "store" },
    {
      key: "store",
      ...DEFAULT_STORE_SETTINGS,
      adminSecretHash
    },
    { upsert: true }
  );

  invalidateStoreCaches();
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/[slug]");
  revalidatePath("/contact");
  revalidatePath("/checkout");

  return NextResponse.json({ seeded: seedProducts.length });
}
