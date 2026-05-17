import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  address: z.object({
    fullName: z.string().trim().min(2, "Full name is required"),
    phone: z.string().trim().regex(/^\d{10}$/, "Delivery phone must be 10 digits"),
    line1: z.string().trim().min(5, "Address line 1 is required"),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().min(2, "State is required"),
    postalCode: z.string().trim().regex(/^\d{6}$/, "Postal code must be 6 digits"),
    landmark: z.string().trim().optional()
  })
});
