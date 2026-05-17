export type Category =
  | "Diabetes Care"
  | "Hair Care"
  | "Digestion"
  | "Juices"
  | "Syrups"
  | "Skin Care"
  | "Bone & Joint"
  | "Weight Management"
  | "Women Care"
  | "Wellness";

export type PaymentMethod = "COD" | "ONLINE";
export type PaymentStatus = "pending" | "awaiting_verification" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refund_requested"
  | "refunded";

export type Role = "user" | "admin";

export interface StoreSettings {
  brandName: string;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
  upiId: string;
  qrImageUrl: string;
  businessAddress: string;
  courierDetails: string;
  tagline: string;
  announcementText: string;
  refundPolicyText: string;
  refundPolicyNorms: string;
  subscriptionDiscountPercent: number;
  subscriptionBenefits: string[];
}

export interface StoreSettingsRecord extends StoreSettings {
  _id?: string;
  adminSecretHash?: string;
}

export interface SeedProductInput {
  name: string;
  price: number;
  description: string;
  itemCode: string;
  imageUrl?: string;
}

export interface ProductCardData {
  _id?: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  discountPercent: number;
  deliveryPrice: number;
  description: string;
  brand: string;
  category: Category;
  itemCode: string;
  imageUrl?: string;
  tags: string[];
  stock: number;
  rating?: number;
  reviewCount?: number;
  purchaseCount?: number;
  featured?: boolean;
  benefits: string[];
  ingredients?: string[];
  howToUse?: string[];
  specifications: Record<string, string>;
}

export interface CartItem extends ProductCardData {
  quantity: number;
}

export interface AuthSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  subscriptionStatus?: "inactive" | "pending" | "verified";
  subscriptionActive?: boolean;
  subscriptionPhone?: string;
}
