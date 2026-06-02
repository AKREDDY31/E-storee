import { z } from "zod";

export const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10)
  }),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    landmark: z.string().optional()
  }),
  items: z.array(
    z.object({
      _id: z.string().optional(),
      name: z.string(),
      slug: z.string(),
      itemCode: z.string(),
      price: z.number(),
      deliveryPrice: z.number().optional(),
      quantity: z.number().min(1),
      imageUrl: z.string().optional()
    })
  ),
  paymentMethod: z.enum(["COD", "ONLINE"]),
  paymentReference: z.string().optional(),
  subscriptionEligible: z.boolean().optional(),
  subscriptionPhone: z.string().optional(),
  discountAmount: z.number().optional(),
  estimatedDeliveryDate: z.string().optional()
});
