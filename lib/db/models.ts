import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, min: 13, max: 120 },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    phoneE164: { type: String, default: "" },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    subscriptionStatus: { type: String, enum: ["inactive", "pending", "verified"], default: "inactive" },
    subscriptionActive: { type: Boolean, default: false },
    subscriptionPhone: { type: String, default: "" },
    subscriptionStartedAt: { type: Date },
    subscriptionPaymentReference: { type: String, default: "" },
    subscriptionPaidAmount: { type: Number, default: 0 },
    address: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      landmark: String
    }
  },
  { timestamps: true }
);

const verificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    purpose: {
      type: String,
      enum: ["register_phone", "register_email", "reset_password"],
      required: true
    },
    target: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date }
  },
  { timestamps: true }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    discountPercent: { type: Number, required: true },
    description: { type: String, required: true },
    itemCode: { type: String, required: true, unique: true },
    imageUrl: String,
    deliveryPrice: { type: Number, default: 60 },
    tags: [String],
    benefits: [String],
    ingredients: [String],
    howToUse: [String],
    specifications: { type: Map, of: String, default: {} },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    itemCode: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: String
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      landmark: String
    },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, required: true },
    total: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    subscriptionEligible: { type: Boolean, default: false },
    subscriptionPhone: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["COD", "ONLINE"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "awaiting_verification", "paid", "failed", "refunded"],
      default: "pending"
    },
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "refund_requested", "refunded"],
      default: "placed"
    },
    paymentReference: String,
    adminNotes: String,
    estimatedDeliveryDate: String
  },
  { timestamps: true }
);

const refundSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    requestType: { type: String, enum: ["cancel", "return"], default: "return" },
    reason: { type: String, required: true },
    details: String,
    pickupStatus: {
      type: String,
      enum: ["not_required", "awaiting_pickup", "picked_up"],
      default: "awaiting_pickup"
    },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "processed"],
      default: "requested"
    }
  },
  { timestamps: true }
);

const settingsSchema = new Schema(
  {
    key: { type: String, default: "store", unique: true },
    brandName: { type: String, default: "Vedics.online" },
    siteLogoUrl: { type: String, default: "" },
    supportPhone: { type: String, default: "+91 8978905029" },
    supportEmail: { type: String, default: "support@vedics.online" },
    whatsappNumber: { type: String, default: "918978905029" },
    upiId: { type: String, default: "" },
    qrImageUrl: { type: String, default: "" },
    businessAddress: { type: String, default: "Tamballapalle, Madanapalle, Andhra Pradesh, India" },
    courierDetails: { type: String, default: "Standard courier dispatch within 2-4 business days." },
    tagline: { type: String, default: "Prakruti Jnanam | Pure Ayurveda & Natural Living" },
    announcementText: { type: String, default: "" },
    refundPolicyText: {
      type: String,
      default:
        "You can request cancellation before shipment, or request a return after delivery from My Orders. For prepaid orders, refund is initiated after pickup and processed within 48 hours after collection."
    },
    refundPolicyNorms: {
      type: String,
      default:
        "Refund requests must include a clear reason. Returned products should be unused and in original condition with packaging. Pickup is arranged after approval based on service availability."
    },
    subscriptionDiscountPercent: { type: Number, default: 40 },
    subscriptionBenefits: { type: [String], default: [] },
    adminSecretHash: { type: String, required: true }
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export type VerificationDocument = InferSchemaType<typeof verificationSchema>;
export type ProductDocument = InferSchemaType<typeof productSchema>;
export type OrderDocument = InferSchemaType<typeof orderSchema>;
export type RefundDocument = InferSchemaType<typeof refundSchema>;
export type SettingsDocument = InferSchemaType<typeof settingsSchema>;

export const UserModel = (models.User as Model<UserDocument>) || model<UserDocument>("User", userSchema);
export const VerificationModel = (models.Verification as Model<VerificationDocument>) || model<VerificationDocument>("Verification", verificationSchema);
export const ProductModel = (models.Product as Model<ProductDocument>) || model<ProductDocument>("Product", productSchema);
export const OrderModel = (models.Order as Model<OrderDocument>) || model<OrderDocument>("Order", orderSchema);
export const RefundModel = (models.Refund as Model<RefundDocument>) || model<RefundDocument>("Refund", refundSchema);
export const SettingsModel = (models.Settings as Model<SettingsDocument>) || model<SettingsDocument>("Settings", settingsSchema);
