import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3),
  brand: z.string().min(2),
  category: z.string().min(2),
  price: z.coerce.number().min(1).optional(),
  mrp: z.coerce.number().min(1),
  discountPercent: z.coerce.number().min(0).max(99).optional(),
  deliveryPrice: z.coerce.number().min(0).max(10_000).optional(),
  description: z.string().min(10),
  itemCode: z.string().min(3),
  originalItemCode: z.string().optional(),
  imageUrl: z.string().optional(),
  stock: z.coerce.number().min(0),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().min(0).optional(),
  tags: z.string().optional(),
  benefits: z.string().optional(),
  ingredients: z.string().optional(),
  howToUse: z.string().optional()
});
