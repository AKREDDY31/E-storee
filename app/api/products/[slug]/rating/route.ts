import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { ProductModel } from "@/lib/db/models";
import { invalidateStoreCaches } from "@/lib/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in to rate products" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();
  const rating = Number(body.rating);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  await connectToDatabase();
  const product = (await ProductModel.findOne({ slug }).lean()) as null | {
    _id: unknown;
    rating?: number;
    reviewCount?: number;
  };

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const currentCount = Number(product.reviewCount || 0);
  const currentRating = currentCount > 0 ? Number(product.rating || 0) : 0;
  const nextCount = currentCount + 1;
  const nextRating = Math.round((((currentRating * currentCount) + rating) / nextCount) * 10) / 10;

  const updated = await ProductModel.findByIdAndUpdate(
    product._id,
    {
      rating: nextRating,
      reviewCount: nextCount
    },
    { new: true }
  ).lean();

  invalidateStoreCaches();
  revalidatePath("/shop");
  revalidatePath("/shop/[slug]");

  return NextResponse.json({ product: JSON.parse(JSON.stringify(updated)) });
}