import { type Category, type ProductCardData, type SeedProductInput } from "@/types";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function formatAddressLine(address?: {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  landmark?: string;
}) {
  if (!address) return "";

  const parts = [
    address.fullName,
    address.phone,
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  return parts.join(", ");
}

export function extractMrp(description: string, fallbackPrice: number) {
  const match = description.match(/MRP ₹(\d+)/i);
  return match ? Number(match[1]) : fallbackPrice;
}

export function inferBrand(name: string, description: string) {
  const brandMatch = description.match(/Brand: ([^.]+)/i);
  if (brandMatch) {
    return brandMatch[1].trim();
  }
  if (name.toLowerCase().includes("vedics")) {
    return "Vedics";
  }
  return "Vedics.online";
}

export function inferCategory(input: Pick<SeedProductInput, "name" | "description">): Category {
  const text = `${input.name} ${input.description}`.toLowerCase();

  if (/(diab|jamun|noni)/.test(text)) return "Diabetes Care";
  if (/(hair|shampoo|tailam|oil)/.test(text)) return "Hair Care";
  if (/(triphala|zyme|digestion|antacid|liver|detox|cid|pep)/.test(text)) return "Digestion";
  if (/(juice|ras|drops)/.test(text)) return "Juices";
  if (/(syrup|tonic|care 200ml|mind|ortho|sanjivani|vit|thyro|stone go)/.test(text)) return "Syrups";
  if (/(soap|facewash|gel|cream|beauty|skin)/.test(text)) return "Skin Care";
  if (/(joint|bone|calcium|haddjod|ortho)/.test(text)) return "Bone & Joint";
  if (/(weight loss|weight gain|shake|fizz|slim)/.test(text)) return "Weight Management";
  if (/(women|uterine|pregnancy|garbh)/.test(text)) return "Women Care";
  return "Wellness";
}

export function buildTags(name: string, description: string, category: Category) {
  const tags = new Set<string>([category]);
  if (/sugar free/i.test(description)) tags.add("Sugar Free");
  if (/kids/i.test(description)) tags.add("Kids");
  if (/immunity/i.test(description)) tags.add("Immunity");
  if (/ayurvedic|herbal/i.test(description)) tags.add("Ayurvedic");
  if (/30% off/i.test(description)) tags.add("30% OFF");
  if (/women/i.test(description)) tags.add("Women Care");
  if (/honey/i.test(name)) tags.add("Natural");
  return Array.from(tags);
}

export function buildBenefits(description: string) {
  return description
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function buildSeedProduct(input: SeedProductInput, index: number): ProductCardData {
  const mrp = extractMrp(input.description, input.price);
  const category = inferCategory(input);
  const brand = inferBrand(input.name, input.description);
  const discountPercent = Math.round(((mrp - input.price) / mrp) * 100);

  return {
    name: input.name,
    slug: slugify(input.name),
    price: input.price,
    mrp,
    discountPercent,
    deliveryPrice: 60,
    description: input.description,
    brand,
    category,
    itemCode: input.itemCode,
    imageUrl: input.imageUrl,
    tags: buildTags(input.name, input.description, category),
    stock: 50 + (index % 15) * 5,
    rating: 0,
    reviewCount: 0,
    purchaseCount: 0,
    featured: index < 8,
    benefits: buildBenefits(input.description),
    ingredients: ["Ayurvedic herbal formulation", "Curated wellness ingredients"],
    howToUse: ["Use as directed on the label", "Consult a physician for specific concerns"],
    specifications: {
      SKU: input.itemCode,
      Brand: brand,
      Category: category,
      Availability: "In Stock",
      Dispatch: "2-4 business days"
    }
  };
}

export function buildWhatsAppOrderLink(
  productName: string,
  price: number,
  whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918978905029",
  options?: {
    productUrl?: string;
    customerAddress?: string;
    customerName?: string;
  }
) {
  const messageLines = [
    `Hello, I want to order ${productName} priced at ${formatCurrency(price)} from Vedics.online.`,
    options?.productUrl ? `Product link: ${options.productUrl}` : "",
    options?.customerName ? `Customer: ${options.customerName}` : "",
    options?.customerAddress ? `Delivery address: ${options.customerAddress}` : ""
  ].filter(Boolean);

  const message = encodeURIComponent(messageLines.join("\n"));
  return `https://wa.me/${normalizePhoneNumber(whatsappNumber)}?text=${message}`;
}
