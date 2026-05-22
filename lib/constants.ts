export const BRAND = {
  name: "Vedics.online",
  tagline: "Prakruti Jnanam | Pure Ayurveda & Natural Living",
  phone: "+91 8978905029",
  email: "support@vedics.online",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918978905029",
  location: "Tamballapalle, Madanapalle, Andhra Pradesh, India",
  founded: "Since 2022",
  marketedBy: "Marketed by Vedics, Madanapalle, AP"
};

export const DEFAULT_STORE_SETTINGS = {
  brandName: BRAND.name,
  siteLogoUrl: "",
  supportPhone: BRAND.phone,
  supportEmail: BRAND.email,
  whatsappNumber: BRAND.whatsapp,
  upiId: process.env.NEXT_PUBLIC_UPI_ID || "",
  qrImageUrl: "",
  businessAddress: BRAND.location,
  courierDetails: "Standard courier dispatch within 2-4 business days.",
  tagline: BRAND.tagline,
  announcementText: "",
  refundPolicyText:
    "You can request cancellation before shipment, or request a return after delivery from My Orders. For prepaid orders, refund is initiated after pickup and processed within 48 hours after collection.",
  refundPolicyNorms:
    "Refund requests must include a clear reason. Returned products should be unused and in original condition with packaging. Pickup is arranged after approval based on service availability.",
  subscriptionDiscountPercent: 40,
  subscriptionBenefits: [
    "40% discount on eligible subscription checkout orders",
    "Priority support through the account dashboard",
    "Subscriber badge shown on the profile page"
  ]
};

export const CATEGORY_ORDER = [
  "Diabetes Care",
  "Hair Care",
  "Digestion",
  "Juices",
  "Syrups",
  "Skin Care",
  "Bone & Joint",
  "Weight Management",
  "Women Care",
  "Wellness"
] as const;

export const ORDER_STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" }
] as const;
