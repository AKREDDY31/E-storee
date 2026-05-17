import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { ProductModel, UserModel } from "@/lib/db/models";
import { invalidateStoreCaches } from "@/lib/queries";
import { productSchema } from "@/lib/schemas/product";
import { slugify } from "@/lib/utils";

async function requireAdminSession() {
  const session = await getCurrentSession();
  if (!session) return null;
  if (session.role === "admin") return session;

  await connectToDatabase();
  const user = await UserModel.findById(session.id).lean();
  if (user && user.role === "admin") {
    return { ...session, role: "admin" as const };
  }

  return null;
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const fieldMessages = Object.entries(flattened.fieldErrors)
      .flatMap(([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`))
      .filter(Boolean);

    return NextResponse.json(
      {
        error: "Invalid product payload",
        details: {
          formErrors: flattened.formErrors,
          fieldErrors: flattened.fieldErrors,
          message: fieldMessages.join("; ")
        }
      },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const data = parsed.data;
  const originalItemCode = data.originalItemCode?.trim();
  const existingProduct = (await ProductModel.findOne({
    itemCode: originalItemCode || data.itemCode
  }).lean()) as null | { _id: unknown; discountPercent?: number; deliveryPrice?: number; imageUrl?: string; rating?: number; reviewCount?: number; purchaseCount?: number; featured?: boolean };

  if (originalItemCode) {
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (originalItemCode !== data.itemCode) {
      const duplicate = await ProductModel.findOne({
        itemCode: data.itemCode,
        _id: { $ne: existingProduct._id }
      }).lean();
      if (duplicate) {
        return NextResponse.json({ error: "Another product already uses that item code" }, { status: 409 });
      }
    }
  }

  const discountPercent = data.discountPercent ?? existingProduct?.discountPercent ?? 0;
  const effectivePrice = Math.max(1, Math.round(data.mrp * (1 - discountPercent / 100)));
  const imageUrl = data.imageUrl?.trim() || existingProduct?.imageUrl || undefined;
  const deliveryPrice = Math.max(0, data.deliveryPrice ?? existingProduct?.deliveryPrice ?? 60);
  const metrics = existingProduct
    ? {
        rating: Number(existingProduct.rating || 0),
        reviewCount: Number(existingProduct.reviewCount || 0),
        purchaseCount: Number(existingProduct.purchaseCount || 0),
        featured: Boolean(existingProduct.featured)
      }
    : {
        rating: 0,
        reviewCount: 0,
        purchaseCount: 0,
        featured: false
      };

  const product = await ProductModel.findOneAndUpdate(
    existingProduct ? { _id: existingProduct._id } : { itemCode: data.itemCode },
    {
      name: data.name,
      slug: slugify(data.name),
      brand: data.brand,
      category: data.category,
      price: effectivePrice,
      mrp: data.mrp,
      discountPercent,
      deliveryPrice,
      stock: data.stock,
      description: data.description,
      itemCode: data.itemCode,
      ...(imageUrl ? { imageUrl } : {}),
      tags: data.tags ? data.tags.split(",").map((item) => item.trim()).filter(Boolean) : [],
      benefits: data.benefits ? data.benefits.split(",").map((item) => item.trim()).filter(Boolean) : [],
      ingredients: data.ingredients ? data.ingredients.split(",").map((item) => item.trim()).filter(Boolean) : [],
      howToUse: data.howToUse ? data.howToUse.split(",").map((item) => item.trim()).filter(Boolean) : [],
      ...metrics,
      specifications: {
        SKU: data.itemCode,
        Brand: data.brand,
        Category: data.category,
        Availability: data.stock > 0 ? "In Stock" : "Out of Stock"
      }
    },
    { upsert: true, new: true }
  ).lean();

  invalidateStoreCaches();
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/[slug]");

  return NextResponse.json({ product: JSON.parse(JSON.stringify(product)) });
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemCode = searchParams.get("itemCode")?.trim();

  if (!itemCode) {
    return NextResponse.json({ error: "Item code is required" }, { status: 400 });
  }

  await connectToDatabase();
  const deleted = await ProductModel.findOneAndDelete({ itemCode }).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  invalidateStoreCaches();
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/[slug]");

  return NextResponse.json({ deleted: true });
}
